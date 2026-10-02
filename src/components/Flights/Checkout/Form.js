'use client'
import React, { useState, useEffect } from 'react'
import { countryListLocal } from '@/util/CountryList';
import { Select } from '@mantine/core';
import Link from 'next/link';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { useCurrency } from '@/util/currency';
import { notifications } from '@mantine/notifications';
import { DateInput } from '@mantine/dates';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useRouter } from 'next/navigation';
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import { isValidPhoneNumber } from 'libphonenumber-js';
import moment from 'moment';
import { IoPeopleOutline, IoPersonOutline } from 'react-icons/io5';
import { FaCreditCard } from 'react-icons/fa';
import styles from './Form.module.css';

const createEmptyPassenger = (id, type) => ({
    id,
    type,
    title: '',
    firstName: '',
    lastName: '',
    gender: 'male',
    dob: null,
    email: '',
    country: '',
    nationality: '',
    phoneCode: '',
    phone: '',
    cardType: '',
    cardNum: '',
    cardExpiredDate: null,
});

const formatBookingDate = (value) => {
    if (!value) return '';
    // Prefer moment — Mantine DateInput values are reliable this way in this project
    const m = moment(value);
    if (m.isValid()) return m.format('YYYY-MM-DD');

    if (typeof value === 'object' && typeof value.format === 'function') {
        try {
            return value.format('YYYY-MM-DD');
        } catch {
            /* continue */
        }
    }
    if (typeof value === 'object' && typeof value.toDate === 'function') {
        return formatBookingDate(value.toDate());
    }
    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
        return value;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const y = value.getFullYear();
        const mth = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        return `${y}-${mth}-${d}`;
    }
    return String(value);
};

const normalizePhone = (phoneCode, phone) => {
    let code = String(phoneCode || '').trim();
    if (code && !code.startsWith('+')) code = `+${code}`;
    const national = String(phone || '').replace(/\s+/g, '').replace(/^0+/, '');
    return `${code}${national}`;
};

const normalizeNationality = (code) => {
    const value = String(code || '').trim().toUpperCase();
    if (value === 'UK') return 'GB';
    return value;
};

const normalizeCardType = (value) => {
    const raw = String(value || '').trim().toUpperCase();
    // Passport (P) or Other (O) only — ID Card removed
    if (raw === 'P' || raw === 'O') return raw;
    return '';
};

/** Sample booking payload uses "YYYY-MM-DD HH:mm" for segment datetimes */
const normalizeSegmentDateTime = (value) => {
    if (!value) return value;
    const m = moment(value);
    if (!m.isValid()) return value;
    return m.format('YYYY-MM-DD HH:mm');
};

const sanitizeBookingSegments = (segments) => {
    if (!Array.isArray(segments)) return [];
    return segments.map((seg) => {
        if (!seg || typeof seg !== 'object') return seg;
        const next = { ...seg };
        if (next.departure && typeof next.departure === 'object') {
            next.departure = {
                ...next.departure,
                datetime: normalizeSegmentDateTime(next.departure.datetime),
                date: next.departure.date
                    ? formatBookingDate(next.departure.date)
                    : next.departure.date,
            };
        }
        if (next.arrival && typeof next.arrival === 'object') {
            next.arrival = {
                ...next.arrival,
                datetime: normalizeSegmentDateTime(next.arrival.datetime),
                date: next.arrival.date
                    ? formatBookingDate(next.arrival.date)
                    : next.arrival.date,
            };
        }
        if (next.aircraft && typeof next.aircraft === 'object') {
            next.aircraft = next.aircraft.name || next.aircraft.code || null;
        }
        return next;
    });
};

const getDepartureDate = (flight) => {
    const raw =
        flight?.segments?.[0]?.departure?.datetime ||
        flight?.segments?.[0]?.departure?.date ||
        null;
    if (!raw) return new Date();
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
        return new Date(raw.slice(0, 10));
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const getAgeOnDate = (dob, onDate) => {
    const birthStr = formatBookingDate(dob);
    if (!birthStr || !/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) return null;
    const [by, bm, bd] = birthStr.split('-').map(Number);
    const birth = new Date(by, bm - 1, bd);

    let target;
    if (onDate instanceof Date) {
        target = onDate;
    } else {
        const targetStr = formatBookingDate(onDate);
        if (targetStr && /^\d{4}-\d{2}-\d{2}$/.test(targetStr)) {
            const [ty, tm, td] = targetStr.split('-').map(Number);
            target = new Date(ty, tm - 1, td);
        } else {
            target = new Date(onDate);
        }
    }
    if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) return null;

    let age = target.getFullYear() - birth.getFullYear();
    const monthDiff = target.getMonth() - birth.getMonth();
    const dayDiff = target.getDate() - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
    return age;
};

const getPassengerAgeError = (type, dob, departureDate) => {
    const age = getAgeOnDate(dob, departureDate);
    if (age === null) return 'Please select a valid date of birth';

    if (type === 'infant_without_seat' || type === 'infant') {
        if (age < 0 || age >= 2) {
            return 'Infant date of birth must be under 2 years old on the departure date';
        }
        return '';
    }
    if (type === 'child') {
        if (age < 2 || age >= 12) {
            return 'Child date of birth must be between 2 and 11 years old on the departure date';
        }
        return '';
    }
    if (age < 12) {
        return 'Adult date of birth must be 12 years or older on the departure date';
    }
    return '';
};

const resolveTripType = (flight) => {
    const trip = String(flight?.trip_type || '').toLowerCase().replace(/[\s-]+/g, '_');
    if (trip === 'one_way' || trip === 'oneway') return 'one_way';
    if (trip === 'return' || trip === 'roundtrip' || trip === 'round_trip') return 'return';
    if (trip === 'multicity' || trip === 'multi_city') return 'multi_city';

    const airTripType = flight?.search_criteria?.AirTripType;
    if (airTripType === 'MultiCity') return 'multi_city';
    if (airTripType === 'OneWay') return 'one_way';
    if (airTripType === 'Return' || airTripType === 'RoundTrip') return 'return';

    // Fall back to segment count when trip_type is missing/unexpected
    const segmentCount = Array.isArray(flight?.segments) ? flight.segments.length : 0;
    if (segmentCount > 2) return 'multi_city';
    if (segmentCount === 2) return 'return';
    return 'one_way';
};

const resolvePassengerTypeForBooking = (type) => {
    if (type === 'infant' || type === 'infant_without_seat') return 'infant_without_seat';
    if (type === 'child') return 'child';
    return 'adult';
};

const sortPassengersForBooking = (list) => {
    const rank = (type) => {
        if (type === 'adult') return 0;
        if (type === 'child') return 1;
        return 2;
    };
    return [...list].sort((a, b) => rank(a.type) - rank(b.type));
};

const getPassengerCountsFromFlight = (flight) => {
    if (Array.isArray(flight?.passenger_pricing) && flight.passenger_pricing.length) {
        const counts = { adult: 0, child: 0, infant: 0 };
        flight.passenger_pricing.forEach((pp) => {
            const type = pp.type || pp.passenger_type;
            const qty = Number(pp.quantity) || 1;
            if (type === 'adult') counts.adult += qty;
            else if (type === 'child') counts.child += qty;
            else if (type === 'infant' || type === 'infant_without_seat') counts.infant += qty;
        });
        if (counts.adult + counts.child + counts.infant > 0) return counts;
    }

    return {
        adult: Number(flight?.adults ?? flight?.search_criteria?.adult ?? 0),
        child: Number(flight?.children ?? flight?.search_criteria?.child ?? 0),
        infant: Number(flight?.infants ?? flight?.search_criteria?.infant ?? 0),
    };
};

export default function Form({
    flightdata,
    onPassengersChange,
    mode = 'passengers',
    onContinue,
    ancillarySelections = null,
    continueLoading = false,
}) {
    const { currency, rates } = useCurrency();
    const router = useRouter();
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currencyKey, setCurrencyKey] = useState("");
    const [loaderError, setLoaderError] = useState("");
    const [confirmStatus, setConfirmStatus] = useState("pending"); // "pending" | "booking" | "payment" | "success" | "error"
    const [leadPassenger, setLeadPassenger] = useState({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        dob: null,
        gender: 'male',
        country: '',
        nationality: '',
        phoneCode: '',
        phone: '',
        cardType: '',
        cardNum: '',
        cardExpiredDate: null,
        type: 'adult'
    });
    const [errors, setErrors] = useState({});
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');

    const isOverview = mode === 'overview';
    const isPassengersStep = !isOverview;

    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        cca2: item.cca2,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }));

    useEffect(() => {
        const counts = getPassengerCountsFromFlight(flightdata);
        const adultCount = counts.adult;
        const childCount = counts.child;
        const infantCount = counts.infant;

        if (!flightdata || adultCount + childCount + infantCount <= 0) return;

            const passengerList = [];
            let passengerId = 1;

        for (let i = 1; i < adultCount; i++) {
            passengerList.push(createEmptyPassenger(passengerId++, 'adult'));
        }
        for (let i = 0; i < childCount; i++) {
            passengerList.push(createEmptyPassenger(passengerId++, 'child'));
        }
        for (let i = 0; i < infantCount; i++) {
            passengerList.push(createEmptyPassenger(passengerId++, 'infant_without_seat'));
            }

            setPassengers(passengerList);
    }, [flightdata]);

    useEffect(() => {
        if (typeof onPassengersChange !== 'function') return;
        onPassengersChange([
            {
                id: 'lead',
                ...leadPassenger,
                type: leadPassenger.type || 'adult',
            },
            ...passengers,
        ]);
    }, [leadPassenger, passengers, onPassengersChange]);

    useEffect(() => {
        const callCurrencyAPI = async () => {
            const modelId = flightdata?.offer_id || flightdata?.id;
            if (!modelId) return;
            let APiCurrency = currency;
            if (Object.keys(rates).length === 1) {
                APiCurrency = flightdata?.pricing?.currency;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/checkout/currency`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model_id: modelId,
                        type: "flight",
                        display_currency: APiCurrency,
                        model_currency: flightdata?.pricing?.currency,
                    }),
                });
                const data = await response.json();
                if (data?.success) {
                    setCurrencyKey(data?.data?.uuid);
                }
            } catch (error) {
                console.error("Error calling currency API:", error);
            }
        };

        callCurrencyAPI();
    }, [currency, flightdata?.id, flightdata?.offer_id, rates, flightdata?.pricing?.currency]);

    const getPassengerTypeLabel = (type) => {
        if (type === 'adult') return 'Adult';
        if (type === 'child') return 'Child';
        if (type === 'infant_without_seat' || type === 'infant') return 'Infant';
        return type;
    };

    const normalizeGuestName = (value) =>
        String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    const foldGuestName = (value) =>
        normalizeGuestName(value).replace(/[aeiou]/g, "");

    const namesAreSame = (firstA, lastA, firstB, lastB) => {
        const first1 = normalizeGuestName(firstA);
        const last1 = normalizeGuestName(lastA);
        const first2 = normalizeGuestName(firstB);
        const last2 = normalizeGuestName(lastB);
        if (!first1 || !last1 || !first2 || !last2) return false;
        if (first1 === first2 && last1 === last2) return true;
        const foldedFirst1 = foldGuestName(first1);
        const foldedFirst2 = foldGuestName(first2);
        return (
            last1 === last2 &&
            foldedFirst1 === foldedFirst2 &&
            foldedFirst1.length >= 3
        );
    };

    const NAME_CONFLICT_MSG =
        "Lead guest first and last name cannot match another guest.";
    const GUEST_CONFLICT_MSG = "This name is already used for another guest.";

    const getDuplicateNameErrors = (leadFirst, leadLast, guests) => {
        const guestErrors = guests.map(() => ({}));
        const leadErrors = {};

        guests.forEach((guest, index) => {
            if (namesAreSame(leadFirst, leadLast, guest.firstName, guest.lastName)) {
                guestErrors[index].firstName = NAME_CONFLICT_MSG;
                guestErrors[index].lastName = NAME_CONFLICT_MSG;
                leadErrors.firstName = NAME_CONFLICT_MSG;
                leadErrors.lastName = NAME_CONFLICT_MSG;
            }

            guests.forEach((other, otherIndex) => {
                if (otherIndex <= index) return;
                if (
                    namesAreSame(
                        guest.firstName,
                        guest.lastName,
                        other.firstName,
                        other.lastName,
                    )
                ) {
                    guestErrors[index].firstName = GUEST_CONFLICT_MSG;
                    guestErrors[index].lastName = GUEST_CONFLICT_MSG;
                    guestErrors[otherIndex].firstName = GUEST_CONFLICT_MSG;
                    guestErrors[otherIndex].lastName = GUEST_CONFLICT_MSG;
                }
            });
        });

        return { leadErrors, guestErrors };
    };

    useEffect(() => {
        const { leadErrors, guestErrors } = getDuplicateNameErrors(
            leadPassenger.firstName,
            leadPassenger.lastName,
            passengers,
        );
        setErrors((prev) => {
            const next = { ...prev };
            if (leadErrors.firstName) {
                next.lead_firstName = leadErrors.firstName;
                next.lead_lastName = leadErrors.lastName;
            } else {
                if (next.lead_firstName === NAME_CONFLICT_MSG) delete next.lead_firstName;
                if (next.lead_lastName === NAME_CONFLICT_MSG) delete next.lead_lastName;
            }
            passengers.forEach((passenger, index) => {
                const conflict = guestErrors[index]?.firstName;
                if (conflict) {
                    next[`passenger_${passenger.id}_firstName`] = conflict;
                    next[`passenger_${passenger.id}_lastName`] = conflict;
                } else {
                    const firstKey = `passenger_${passenger.id}_firstName`;
                    const lastKey = `passenger_${passenger.id}_lastName`;
                    if (
                        next[firstKey] === NAME_CONFLICT_MSG ||
                        next[firstKey] === GUEST_CONFLICT_MSG
                    ) {
                        delete next[firstKey];
                    }
                    if (
                        next[lastKey] === NAME_CONFLICT_MSG ||
                        next[lastKey] === GUEST_CONFLICT_MSG
                    ) {
                        delete next[lastKey];
                    }
                }
            });
            return next;
        });
    }, [leadPassenger.firstName, leadPassenger.lastName, passengers]);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const getFieldLabel = (name) => {
        const labels = {
            title: 'Title',
            firstName: 'First name',
            lastName: 'Last name',
            email: 'Email',
            dob: 'Date of birth',
            gender: 'Gender',
            country: 'Country',
            phone: 'Phone number',
            cardType: 'ID type',
            cardNum: 'ID number',
            cardExpiredDate: 'ID expiry date',
            passportNumber: 'Passport number',
            passportExpiry: 'Passport expiry',
        };
        if (labels[name]) return labels[name];
        const spaced = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    };

    const validateField = (name, value, isLeadPassenger = true, passengerData = null) => {
        if (value instanceof Date) {
            if (Number.isNaN(value.getTime())) {
                return `${getFieldLabel(name)} is required`;
            }
        } else if (value === null || value === undefined || String(value).trim() === '') {
            return `${getFieldLabel(name)} is required`;
        }

        if (name === 'firstName' || name === 'lastName') {
            const length = String(value).trim().length;
            if (length < 3 || length > 20) {
                return `${getFieldLabel(name)} must be between 3 and 20 characters`;
            }
        }
        if (name === 'email' && String(value).length > 200) {
            return 'Email cannot exceed 200 characters.';
        }
        if (name === 'email' && isLeadPassenger && !validateEmail(String(value).trim())) {
            return 'Please enter a valid email address';
        }

        if (name === 'phone') {
            const phoneCode = isLeadPassenger ? leadPassenger.phoneCode : passengerData?.phoneCode;
            const phone = isLeadPassenger ? leadPassenger.phone : passengerData?.phone;

            if (phoneCode && phone) {
                const phoneNumber = isValidPhoneNumber(normalizePhone(phoneCode, phone));
                if (!phoneNumber) {
                    return 'Please enter a valid phone number';
                }
            }
        }

        if (name === 'cardNum' && String(value).trim().length < 6) {
            return 'Document number must be at least 6 characters';
        }

        if (name === 'cardType' && !['P', 'O'].includes(String(value).toUpperCase())) {
            return 'Please select a valid document type';
        }

        if (name === 'cardExpiredDate') {
            const expiry = moment(value);
            if (!expiry.isValid()) {
                return 'Please enter a valid document expiry date';
            }
            if (expiry.isBefore(moment().startOf('day'))) {
                return 'Document expiry must be a future date';
            }
        }

        return '';
    };

    const getGenderFromTitle = (title) => {
        const t = String(title || "").toUpperCase();
        if (t === "MR") return "male";
        if (t === "MRS" || t === "MISS" || t === "MS") return "female";
        return null; // DR or empty — gender stays editable
    };

    const isGenderLockedByTitle = (title) => getGenderFromTitle(title) !== null;

    const handleLeadPassengerChange = (field, value) => {
        // Only allow alphabets and spaces for name fields
        let finalValue = value;
        if (field === 'firstName' || field === 'lastName') {
            finalValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 20);
        } else if (field === 'email') {
            finalValue = String(value).slice(0, 200);
        } else if (field === 'cardNum') {
            finalValue = String(value).replace(/\s+/g, '').slice(0, 30);
        }

        setLeadPassenger((prev) => {
            const updated = { ...prev, [field]: finalValue };
            if (field === "title") {
                const genderFromTitle = getGenderFromTitle(finalValue);
                if (genderFromTitle) {
                    updated.gender = genderFromTitle;
                }
            }
            return updated;
        });

        if (errors[`lead_${field}`] && field !== 'firstName' && field !== 'lastName') {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`lead_${field}`];
                if (field === "title") {
                    delete newErrors.lead_gender;
                }
                return newErrors;
            });
        }
    };

    const handleLeadCountryChange = (value) => {
        const country = countryOptions.find(c => c.value === value);
        setLeadPassenger(prev => ({
            ...prev,
            country: value,
            nationality: country?.cca2 || '',
            phoneCode: country?.code || '',
        }));

        if (errors['lead_country']) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors['lead_country'];
                return newErrors;
            });
        }
    };

    const handleLeadPhoneChange = (value) => {
        // Only allow numbers
        const numericValue = value.replace(/[^0-9]/g, '');
        setLeadPassenger(prev => ({ ...prev, phone: numericValue }));

        if (errors['lead_phone']) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors['lead_phone'];
                return newErrors;
            });
        }
    };

    const handlePassengerChange = (id, field, value) => {
        // Only allow numbers for phone field
        let finalValue = value;
        if (field === 'phone') {
            finalValue = value.replace(/[^0-9]/g, '');
        } else if (field === 'firstName' || field === 'lastName') {
            finalValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 20);
        } else if (field === 'email') {
            finalValue = String(value).slice(0, 200);
        } else if (field === 'cardNum') {
            finalValue = String(value).replace(/\s+/g, '').slice(0, 30);
        }

        setPassengers((prev) =>
            prev.map((p) => {
                if (p.id !== id) return p;
                const updated = { ...p, [field]: finalValue };
                if (field === "title") {
                    const genderFromTitle = getGenderFromTitle(finalValue);
                    if (genderFromTitle) {
                        updated.gender = genderFromTitle;
                    }
                }
                return updated;
            }),
        );

        if (errors[`passenger_${id}_${field}`] && field !== 'firstName' && field !== 'lastName') {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`passenger_${id}_${field}`];
                if (field === "title") {
                    delete newErrors[`passenger_${id}_gender`];
                }
                return newErrors;
            });
        }
    };

    const handlePassengerCountryChange = (id, value) => {
        const country = countryOptions.find(c => c.value === value);
        setPassengers(prev => prev.map(p =>
            p.id === id
                ? {
                    ...p,
                    country: value,
                    nationality: country?.cca2 || '',
                    phoneCode: country?.code || '',
                }
                : p
        ));

        if (errors[`passenger_${id}_country`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`passenger_${id}_country`];
                return newErrors;
            });
        }
    };

    const validateForm = ({ requireTerms = true } = {}) => {
        const newErrors = {};

        // Validate lead passenger
        const leadFields = [
            'title',
            'firstName',
            'lastName',
            'email',
            'dob',
            'gender',
            'country',
            'phone',
            'cardType',
            'cardNum',
            'cardExpiredDate',
        ];
        leadFields.forEach(field => {
            const error = validateField(field, leadPassenger[field], true);
            if (error) {
                newErrors[`lead_${field}`] = error;
            }
        });

        // Validate other passengers
        passengers.forEach(passenger => {
            const passengerFields = [
                'title',
                'firstName',
                'lastName',
                'gender',
                'dob',
                'country',
                'email',
                'phone',
                'cardType',
                'cardNum',
                'cardExpiredDate',
            ];
            passengerFields.forEach(field => {
                const error = validateField(field, passenger[field], false, passenger);
                if (error) {
                    newErrors[`passenger_${passenger.id}_${field}`] = error;
                }
            });
        });

        const { leadErrors, guestErrors } = getDuplicateNameErrors(
            leadPassenger.firstName,
            leadPassenger.lastName,
            passengers,
        );
        if (leadErrors.firstName) {
            newErrors.lead_firstName = leadErrors.firstName;
            newErrors.lead_lastName = leadErrors.lastName;
        }
        passengers.forEach((passenger, index) => {
            if (guestErrors[index]?.firstName) {
                newErrors[`passenger_${passenger.id}_firstName`] =
                    guestErrors[index].firstName;
                newErrors[`passenger_${passenger.id}_lastName`] =
                    guestErrors[index].lastName;
            }
        });

        // Validate terms (overview / confirm only)
        if (requireTerms && !termsAccepted) {
            newErrors['terms'] = 'You must accept the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const sumAncillaryAmount = (selections) => {
        let total = 0;
        const bags = selections?.baggage?.items;
        if (Array.isArray(bags) && bags.length) {
            total += bags.reduce((sum, bag) => sum + Number(bag?.price || 0), 0);
        } else {
            const byPassenger = selections?.baggage?.byPassenger || {};
            Object.values(byPassenger).forEach((byLeg) => {
                Object.values(byLeg || {}).forEach((bag) => {
                    total += Number(bag?.price || 0);
                });
            });
        }
        Object.values(selections?.seats || {}).forEach((bySegment) => {
            Object.values(bySegment || {}).forEach((seat) => {
                total += Number(seat?.seatPrice || seat?.price || 0);
            });
        });
        return total;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isPassengersStep && typeof onContinue === 'function') {
            if (validateForm({ requireTerms: false })) {
                onContinue();
            }
            return;
        }

        if (validateForm({ requireTerms: true })) {
            setConfirmStatus("pending");
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setConfirmStatus("validate");

            const packageCurrency = flightdata?.pricing?.currency || 'GBP';
            const ancillaryExtra = sumAncillaryAmount(ancillarySelections);
            const grandTotal = Number(flightdata?.pricing?.total_amount) + ancillaryExtra;

            let customerCurrency = currency;
            let customerExchangeRate = 1;
            let customerTotalAfterDiscount = grandTotal;

            if (currency !== packageCurrency && rates[packageCurrency] && rates[currency]) {
                const conversion = ConvertPrice(grandTotal, packageCurrency, currency, rates);
                customerCurrency = conversion.newcurrency;
                customerTotalAfterDiscount = parseFloat(conversion.newprice);
                customerExchangeRate = (rates[currency] / rates[packageCurrency]);
            } else {
                customerCurrency = packageCurrency;
                customerExchangeRate = 1;
                customerTotalAfterDiscount = grandTotal;
            }

            const departureDate = getDepartureDate(flightdata);

            const buildPassengerPayload = (passenger) => {
                const nationality = normalizeNationality(
                    passenger.nationality ||
                    countryOptions.find((c) => c.value === passenger.country)?.cca2 ||
                    ''
                );

                return {
                    type: resolvePassengerTypeForBooking(passenger.type),
                    title: String(passenger.title || '').toLowerCase(),
                    firstName: String(passenger.firstName || '').trim(),
                    lastName: String(passenger.lastName || '').trim(),
                    dateOfBirth: formatBookingDate(passenger.dob),
                    gender: passenger.gender === 'male' ? 'm' : 'f',
                    email: String(passenger.email || '').trim(),
                    phone: normalizePhone(passenger.phoneCode, passenger.phone),
                    nationality,
                    cardType: normalizeCardType(passenger.cardType),
                    cardNum: String(passenger.cardNum || '').trim().toUpperCase(),
                    cardExpiredDate: formatBookingDate(passenger.cardExpiredDate),
                };
            };

            const rawPassengers = [
                buildPassengerPayload({
                    ...leadPassenger,
                    type: leadPassenger.type || 'adult',
                }),
                ...passengers.map((passenger) => buildPassengerPayload(passenger)),
            ];

            const passengersArray = sortPassengersForBooking(rawPassengers);

            for (let i = 0; i < passengersArray.length; i++) {
                const p = passengersArray[i];
                const ageError = getPassengerAgeError(p.type, p.dateOfBirth, departureDate);
                if (ageError) {
                    setLoaderError(ageError);
                    setConfirmStatus('error');
                    setTimeout(() => setLoading(false), 800);
                    notifications.show({
                        title: 'Invalid date of birth',
                        message: `${p.type === 'infant_without_seat' ? 'Infant' : p.type === 'child' ? 'Child' : 'Adult'}: ${ageError}`,
                        color: 'red',
                        autoClose: 5000,
                    });
                    return;
                }

                if (!p.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(p.dateOfBirth)) {
                    setLoaderError('Please select a valid Date of Birth for every passenger.');
                    setConfirmStatus('error');
                    setTimeout(() => setLoading(false), 800);
                    return;
                }
                if (!p.cardExpiredDate || !/^\d{4}-\d{2}-\d{2}$/.test(p.cardExpiredDate)) {
                    setLoaderError('Please select a valid Document Expiry for every passenger.');
                    setConfirmStatus('error');
                    setTimeout(() => setLoading(false), 800);
                    return;
                }
                if (!p.nationality || p.nationality.length !== 2) {
                    setLoaderError('Please select a valid nationality for every passenger.');
                    setConfirmStatus('error');
                    setTimeout(() => setLoading(false), 800);
                    return;
                }
                if (!p.cardType || !['P', 'O'].includes(p.cardType)) {
                    setLoaderError('Please select a valid document type (Passport or Other).');
                    setConfirmStatus('error');
                    setTimeout(() => setLoading(false), 800);
                    return;
                }
                if (!p.phone || p.phone.length < 8) {
                    setLoaderError('Please enter a valid phone number with country code.');
                    setConfirmStatus('error');
                    setTimeout(() => setLoading(false), 800);
                    return;
                }
                if (!p.title) {
                    setLoaderError('Please select a title for every passenger.');
                    setConfirmStatus('error');
                    setTimeout(() => setLoading(false), 800);
                    return;
                }
            }

            const expectedCounts = getPassengerCountsFromFlight(flightdata);
            const actualCounts = passengersArray.reduce(
                (acc, p) => {
                    if (p.type === 'adult') acc.adult += 1;
                    else if (p.type === 'child') acc.child += 1;
                    else if (p.type === 'infant_without_seat' || p.type === 'infant') acc.infant += 1;
                    return acc;
                },
                { adult: 0, child: 0, infant: 0 }
            );

            if (
                actualCounts.adult !== expectedCounts.adult ||
                actualCounts.child !== expectedCounts.child ||
                actualCounts.infant !== expectedCounts.infant
            ) {
                setLoaderError(
                    `Passenger count mismatch. Offer expects ${expectedCounts.adult} adult(s), ${expectedCounts.child} child(ren), ${expectedCounts.infant} infant(s).`
                );
                setConfirmStatus('error');
                setTimeout(() => setLoading(false), 800);
                notifications.show({
                    title: 'Passenger mismatch',
                    message: 'Please go back and select the flight again with the correct passengers.',
                    color: 'red',
                    autoClose: 4500,
                });
                return;
            }

            // Prefer provider offer_id (pkfare/duffel), then fallback to id
            const offerId = String(flightdata?.offer_id || flightdata?.id || '').trim();
            if (!currencyKey) {
                setLoaderError('Currency session missing. Please refresh and try again.');
                setConfirmStatus('error');
                setTimeout(() => setLoading(false), 800);
                return;
            }
            if (!flightdata?.provider || !offerId) {
                setLoaderError('Flight offer is missing. Please select the flight again.');
                setConfirmStatus('error');
                setTimeout(() => setLoading(false), 800);
                return;
            }

            const safeAmount = Number(Number(customerTotalAfterDiscount).toFixed(2));
            const safeRate = Number(Number(customerExchangeRate).toFixed(2));
            if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
                setLoaderError('Invalid flight price. Please go back and select the flight again.');
                setConfirmStatus('error');
                setTimeout(() => setLoading(false), 800);
                return;
            }

            // Exact shape from working booking sample
            const request = {
                provider: flightdata.provider,
                booking_type: 'hold',
                payment_method: 'stripe',
                trip_type: resolveTripType(flightdata),
                currency_uuid: currencyKey,
                offer_id: offerId,
                customer_currency: customerCurrency,
                customer_exchange_rate: Number.isFinite(safeRate) ? safeRate : 1,
                customer_amount: safeAmount,
                passengers: passengersArray,
                tag: flightdata?.tag == null ? '' : String(flightdata.tag),
                segments: sanitizeBookingSegments(flightdata?.segments || []),
                pricing: flightdata?.pricing || {},
            };

            const ancillaryPayload = ancillarySelections?.ancillary;
            if (
                ancillaryPayload &&
                Array.isArray(ancillaryPayload.journeys) &&
                ancillaryPayload.journeys.length > 0
            ) {
                request.ancillary = ancillaryPayload;
            }

            if (!request.passengers?.length || !request.booking_type || !request.offer_id) {
                setLoaderError('Booking payload incomplete. Please refresh and try again.');
                setConfirmStatus('error');
                setTimeout(() => setLoading(false), 800);
                return;
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(request),
                    redirect: 'manual',
                });

                if (res.status >= 300 && res.status < 400) {
                    throw new Error(
                        `Booking failed with redirect (${res.status}). Please try again or contact support.`
                    );
                }

                const contentType = res.headers.get('content-type') || '';
                const rawText = await res.text();
                let response = null;
                if (contentType.includes('application/json') || rawText.trim().startsWith('{')) {
                    try {
                        response = JSON.parse(rawText);
                    } catch {
                        throw new Error('Invalid booking response from server.');
                    }
                } else {
                    throw new Error(
                        rawText?.slice(0, 120) ||
                        `Booking failed with status ${res.status}. Please try again.`
                    );
                }

                if (response?.success) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                    setConfirmStatus("reserve");
                    await handlePayment(response?.data);
                } else {
                    const providerCode = response?.error?.details?.errorCode;
                    const providerMsg =
                        response?.error?.details?.errorMsg ||
                        response?.error?.details?.message ||
                        response?.error?.message;
                    let errorMessage =
                        response?.error?.message ||
                        response?.message ||
                        (response?.errors
                            ? Object.values(response.errors).flat().join(' ')
                            : null) ||
                        'Booking failed. Please try again.';

                    // Keep API message; append provider detail when available
                    if (providerCode === 'P006' || /invalid parameter/i.test(String(providerMsg || errorMessage))) {
                        errorMessage =
                            'Invalid parameter (P006). Please go back, select the flight again (offer may have expired), and use a real passenger name (3–20 letters), Passport number, phone with country code, and nationality.';
                    } else if (providerCode || providerMsg) {
                        const detail = [providerCode, providerMsg].filter(Boolean).join(': ');
                        if (detail && !String(errorMessage).includes(detail)) {
                            errorMessage = `${errorMessage} (${detail})`;
                        }
                    }

                    setLoaderError(errorMessage);
                    setConfirmStatus("error");
                    setTimeout(() => {
                        setLoading(false);
                        notifications.show({
                            title: 'Error',
                            message: errorMessage,
                            autoClose: 5500,
                            color: 'red'
                        })
                    }, 1000);
                }
            } catch (err) {
                setLoaderError(err?.message || "A network error occurred. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setLoading(false);
                    notifications.show({
                        title: 'Error',
                        message: err?.message || 'A network error occurred. Please try again.',
                        autoClose: 4000,
                        color: 'red',
                    });
                }, 1000);
            }
        } else {
            const firstError = document.querySelector('.is-invalid');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };
    const handlePayment = async (data) => {
        const domain = window.location.origin;
        const checkoutUrl = window.location.href;
        const request = {
            "provider": data?.provider,
            'booking_reference': data?.booking_reference,
            'success_url': `${domain}/flights/voucher/${data?.booking_reference}`,
            'cancel_url': `${checkoutUrl}`
        }
        localStorage.setItem('lead_details_fill', JSON.stringify(leadPassenger));
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true', 
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            if (response?.success) {
                setConfirmStatus("payment");
                setTimeout(() => {
                    setLoading(false);
                    router.push(response?.data?.checkout_url);
                }, 800);

            } else {
                setLoaderError(response?.error?.message || "Booking failed. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setLoading(false);
                    notifications.show({
                        title: 'Error',
                        message: response?.error?.message,
                        autoClose: 3500,
                        color: 'red'
                    })
                }, 1000);
            }
        } catch (err) {
            setLoaderError("A network error occurred. Please try again.");
            setConfirmStatus("error");
            setTimeout(() => setLoading(false), 1000);
        }
    };
    const handleLoaderComplete = () => {
    };

    const passengerCounts = getPassengerCountsFromFlight(flightdata);
    const totalPassengers =
        Number(passengerCounts.adult || 0) +
        Number(passengerCounts.child || 0) +
        Number(passengerCounts.infant || 0);
    const passengerCountChips = [
        passengerCounts.adult > 0
            ? `${passengerCounts.adult} Adult${passengerCounts.adult > 1 ? 's' : ''}`
            : null,
        passengerCounts.child > 0
            ? `${passengerCounts.child} Child${passengerCounts.child > 1 ? 'ren' : ''}`
            : null,
        passengerCounts.infant > 0
            ? `${passengerCounts.infant} Infant${passengerCounts.infant > 1 ? 's' : ''}`
            : null,
    ].filter(Boolean);

    return (
        <div className={styles.formWrapper}>
            {isPassengersStep && <LeadDetail setFormData={setLeadPassenger} module="flight" />}
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Flight"
                />
            )}

            {isPassengersStep && (
            <>
            <header className={styles.checkoutHeader}>
                <h2 className={styles.checkoutTitle}>Checkout</h2>
                <p className={styles.checkoutSubtitle}>
                    Complete your booking — enter passenger and payment details
                </p>
            </header>

            <div className={styles.countCard}>
                <div className={styles.countCardHeader}>
                    <span className={styles.countCardIcon} aria-hidden>
                        <IoPeopleOutline />
                    </span>
                    <h3 className={styles.countCardTitle}>Number of Passengers</h3>
                </div>
                <div className={styles.countRow}>
                    <span className={styles.countValueBox}>{totalPassengers || 1}</span>
                    <span className={styles.countLabel}>
                        {totalPassengers === 1 ? 'passenger' : 'passengers'}
                    </span>
                    {passengerCountChips.length > 0 && (
                        <div className={styles.countBreakdown}>
                            {passengerCountChips.map((chip) => (
                                <span key={chip} className={styles.countChip}>
                                    {chip}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.formCard}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardIcon} aria-hidden>
                        <IoPersonOutline />
                    </span>
                    <h3 className={styles.cardTitle}>Lead Passenger Details</h3>
                </div>
                <div className={styles.fieldGrid}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadTitle" className={styles.label}>
                            Title <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="leadTitle"
                            value={leadPassenger.title}
                            onChange={(e) => handleLeadPassengerChange('title', e.target.value)}
                            className={`${styles.select} ${errors.lead_title ? styles.inputError : ''}`}
                        >
                            <option value="">Select</option>
                            <option value="MR">Mr</option>
                            <option value="MRS">Mrs</option>
                            <option value="MISS">Miss</option>
                            <option value="DR">Dr</option>
                        </select>
                        {errors.lead_title && <p className={styles.errorText}>{errors.lead_title}</p>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadFirstName" className={styles.label}>
                            First Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="leadFirstName"
                            value={leadPassenger.firstName}
                            onChange={(e) => handleLeadPassengerChange('firstName', e.target.value)}
                            maxLength={20}
                            className={`${styles.input} ${errors.lead_firstName ? styles.inputError : ''}`}
                            placeholder="e.g. Ahmed"
                        />
                        {errors.lead_firstName && <p className={styles.errorText}>{errors.lead_firstName}</p>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadLastName" className={styles.label}>
                            Last Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="leadLastName"
                            value={leadPassenger.lastName}
                            onChange={(e) => handleLeadPassengerChange('lastName', e.target.value)}
                            maxLength={20}
                            className={`${styles.input} ${errors.lead_lastName ? styles.inputError : ''}`}
                            placeholder="e.g. Khan"
                        />
                        {errors.lead_lastName && <p className={styles.errorText}>{errors.lead_lastName}</p>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadEmail" className={styles.label}>
                            Email Address <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="email"
                            id="leadEmail"
                            value={leadPassenger.email}
                            onChange={(e) => handleLeadPassengerChange('email', e.target.value)}
                            maxLength={200}
                            className={`${styles.input} ${errors.lead_email ? styles.inputError : ''}`}
                            placeholder="you@example.com"
                        />
                        {errors.lead_email && <p className={styles.errorText}>{errors.lead_email}</p>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadDob" className={styles.label}>
                            Date of Birth <span className={styles.required}>*</span>
                        </label>
                        <DateInput
                            className={styles.dateInput}
                            maxDate={new Date()}
                            placeholder="YYYY-MM-DD"
                            valueFormat="YYYY-MM-DD"
                            clearable
                            error={errors.lead_dob}
                            value={leadPassenger.dob}
                            onChange={(date) => handleLeadPassengerChange('dob', date)}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <span className={styles.label}>
                            Gender <span className={styles.required}>*</span>
                        </span>
                        <div className={styles.genderGroup}>
                            <label className={styles.radioLabel} htmlFor="leadMale">
                                <input
                                    className={styles.radioInput}
                                    type="radio"
                                    name="leadGender"
                                    id="leadMale"
                                    value="male"
                                    checked={leadPassenger.gender === 'male'}
                                    disabled={isGenderLockedByTitle(leadPassenger.title)}
                                    onChange={(e) => handleLeadPassengerChange('gender', e.target.value)}
                                />
                                Male
                            </label>
                            <label className={styles.radioLabel} htmlFor="leadFemale">
                                <input
                                    className={styles.radioInput}
                                    type="radio"
                                    name="leadGender"
                                    id="leadFemale"
                                    value="female"
                                    checked={leadPassenger.gender === 'female'}
                                    disabled={isGenderLockedByTitle(leadPassenger.title)}
                                    onChange={(e) => handleLeadPassengerChange('gender', e.target.value)}
                                />
                                Female
                            </label>
                        </div>
                        {errors.lead_gender && <p className={styles.errorText}>{errors.lead_gender}</p>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadCountry" className={styles.label}>
                            Country / Nationality <span className={styles.required}>*</span>
                        </label>
                        <Select
                            id="leadCountry"
                            className={styles.selectInput}
                            placeholder="Select Country"
                            searchable
                            value={leadPassenger.country}
                            onChange={handleLeadCountryChange}
                            data={countryOptions}
                            limit={50}
                            error={errors.lead_country}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadPhone" className={styles.label}>
                            Phone Number <span className={styles.required}>*</span>
                        </label>
                        <div className={`${styles.phoneGroup} ${errors.lead_phone ? styles.phoneGroupError : ''}`}>
                            <span className={styles.phonePrefix}>
                                {leadPassenger.phoneCode || '+__'}
                            </span>
                            <input
                                type="text"
                                id="leadPhone"
                                name="leadPhone"
                                value={leadPassenger.phone}
                                onChange={(e) => handleLeadPhoneChange(e.target.value)}
                                className={`${styles.input} ${styles.phoneInput}`}
                                placeholder="1234567890"
                                autoComplete="off"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </div>
                        {errors.lead_phone && <p className={styles.errorText}>{errors.lead_phone}</p>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadCardType" className={styles.label}>
                            ID Type <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="leadCardType"
                            value={leadPassenger.cardType === 'N' || leadPassenger.cardType === 'A' || leadPassenger.cardType === 'I' ? '' : leadPassenger.cardType}
                            onChange={(e) => handleLeadPassengerChange('cardType', e.target.value)}
                            className={`${styles.select} ${errors.lead_cardType ? styles.inputError : ''}`}
                        >
                            <option value="">Select</option>
                            <option value="P">Passport</option>
                            <option value="O">Other</option>
                        </select>
                        {errors.lead_cardType && <p className={styles.errorText}>{errors.lead_cardType}</p>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="leadCardNum" className={styles.label}>
                            ID Number <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="leadCardNum"
                            value={leadPassenger.cardNum}
                            onChange={(e) => handleLeadPassengerChange('cardNum', e.target.value)}
                            className={`${styles.input} ${errors.lead_cardNum ? styles.inputError : ''}`}
                            placeholder="e.g. AB1360538"
                        />
                        {errors.lead_cardNum && <p className={styles.errorText}>{errors.lead_cardNum}</p>}
                    </div>
                    <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                        <label htmlFor="leadCardExpiredDate" className={styles.label}>
                            ID Expiry Date <span className={styles.required}>*</span>
                        </label>
                        <DateInput
                            id="leadCardExpiredDate"
                            className={styles.dateInput}
                            minDate={new Date()}
                            placeholder="Document Expiry"
                            valueFormat="YYYY-MM-DD"
                            clearable
                            error={errors.lead_cardExpiredDate}
                            value={leadPassenger.cardExpiredDate}
                            onChange={(date) => handleLeadPassengerChange('cardExpiredDate', date)}
                        />
                    </div>
                </div>
                <p className={styles.sectionNote}>
                    This information will be used for all booking confirmations and
                    communications. Ensure that the name matches travel documents.
                </p>
            </div>

            {passengers.length > 0 && (
                <div className={styles.formCard}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon} aria-hidden>
                            <IoPeopleOutline />
                        </span>
                        <h3 className={styles.cardTitle}>Other Passengers</h3>
                    </div>
                    {passengers.map((passenger, index) => (
                        <div key={passenger.id} className={styles.passengerBlock}>
                            <div className={styles.passengerHeader}>
                                <h4 className={styles.passengerTitle}>Passenger {index + 2}</h4>
                                <span className={styles.passengerBadge}>
                                    {getPassengerTypeLabel(passenger.type)}
                                </span>
                            </div>
                            <div className={styles.fieldGrid}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        Title <span className={styles.required}>*</span>
                                    </label>
                                    <select
                                        value={passenger.title}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'title', e.target.value)}
                                        className={`${styles.select} ${errors[`passenger_${passenger.id}_title`] ? styles.inputError : ''}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="MR">Mr</option>
                                        <option value="MRS">Mrs</option>
                                        <option value="MISS">Miss</option>
                                        <option value="DR">Dr</option>
                                    </select>
                                    {errors[`passenger_${passenger.id}_title`] && (
                                        <p className={styles.errorText}>{errors[`passenger_${passenger.id}_title`]}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        First Name <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={passenger.firstName}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'firstName', e.target.value)}
                                        maxLength={20}
                                        placeholder="e.g. Ahmed"
                                        className={`${styles.input} ${errors[`passenger_${passenger.id}_firstName`] ? styles.inputError : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_firstName`] && (
                                        <p className={styles.errorText}>{errors[`passenger_${passenger.id}_firstName`]}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        Last Name <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={passenger.lastName}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'lastName', e.target.value)}
                                        maxLength={20}
                                        placeholder="e.g. Khan"
                                        className={`${styles.input} ${errors[`passenger_${passenger.id}_lastName`] ? styles.inputError : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_lastName`] && (
                                        <p className={styles.errorText}>{errors[`passenger_${passenger.id}_lastName`]}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        Date of Birth <span className={styles.required}>*</span>
                                    </label>
                                    <DateInput
                                        className={styles.dateInput}
                                        maxDate={new Date()}
                                        placeholder="YYYY-MM-DD"
                                        valueFormat="YYYY-MM-DD"
                                        clearable
                                        error={errors[`passenger_${passenger.id}_dob`]}
                                        value={passenger.dob}
                                        onChange={(date) => handlePassengerChange(passenger.id, 'dob', date)}
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        Email <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={passenger.email}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'email', e.target.value)}
                                        maxLength={200}
                                        placeholder="you@example.com"
                                        className={`${styles.input} ${errors[`passenger_${passenger.id}_email`] ? styles.inputError : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_email`] && (
                                        <p className={styles.errorText}>{errors[`passenger_${passenger.id}_email`]}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <span className={styles.label}>
                                        Gender <span className={styles.required}>*</span>
                                    </span>
                                    <div className={styles.genderGroup}>
                                        <label className={styles.radioLabel} htmlFor={`male_${passenger.id}`}>
                                            <input
                                                className={styles.radioInput}
                                                type="radio"
                                                name={`gender_${passenger.id}`}
                                                id={`male_${passenger.id}`}
                                                value="male"
                                                checked={passenger.gender === 'male'}
                                                disabled={isGenderLockedByTitle(passenger.title)}
                                                onChange={(e) => handlePassengerChange(passenger.id, 'gender', e.target.value)}
                                            />
                                            Male
                                        </label>
                                        <label className={styles.radioLabel} htmlFor={`female_${passenger.id}`}>
                                            <input
                                                className={styles.radioInput}
                                                type="radio"
                                                name={`gender_${passenger.id}`}
                                                id={`female_${passenger.id}`}
                                                value="female"
                                                checked={passenger.gender === 'female'}
                                                disabled={isGenderLockedByTitle(passenger.title)}
                                                onChange={(e) => handlePassengerChange(passenger.id, 'gender', e.target.value)}
                                            />
                                            Female
                                        </label>
                                    </div>
                                    {errors[`passenger_${passenger.id}_gender`] && (
                                        <p className={styles.errorText}>{errors[`passenger_${passenger.id}_gender`]}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        Country <span className={styles.required}>*</span>
                                    </label>
                                    <Select
                                        className={styles.selectInput}
                                        placeholder="Select Country"
                                        searchable
                                        value={passenger.country}
                                        onChange={(value) => handlePassengerCountryChange(passenger.id, value)}
                                        data={countryOptions}
                                        limit={50}
                                        error={errors[`passenger_${passenger.id}_country`]}
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        Phone Number <span className={styles.required}>*</span>
                                    </label>
                                    <div className={`${styles.phoneGroup} ${errors[`passenger_${passenger.id}_phone`] ? styles.phoneGroupError : ''}`}>
                                        <span className={styles.phonePrefix}>
                                            {passenger.phoneCode || '+__'}
                                        </span>
                                        <input
                                            type="text"
                                            name="leadPhone"
                                            value={passenger.phone}
                                            onChange={(e) => handlePassengerChange(passenger.id, 'phone', e.target.value)}
                                            className={`${styles.input} ${styles.phoneInput}`}
                                            placeholder="1234567890"
                                            autoComplete="off"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                        />
                                    </div>
                                    {errors[`passenger_${passenger.id}_phone`] && (
                                        <p className={styles.errorText}>{errors[`passenger_${passenger.id}_phone`]}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        ID Type <span className={styles.required}>*</span>
                                    </label>
                                    <select
                                        value={
                                            passenger.cardType === 'N' || passenger.cardType === 'A' || passenger.cardType === 'I'
                                                ? ''
                                                : passenger.cardType || ''
                                        }
                                        onChange={(e) => handlePassengerChange(passenger.id, 'cardType', e.target.value)}
                                        className={`${styles.select} ${errors[`passenger_${passenger.id}_cardType`] ? styles.inputError : ''}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="P">Passport</option>
                                        <option value="O">Other</option>
                                    </select>
                                    {errors[`passenger_${passenger.id}_cardType`] && (
                                        <p className={styles.errorText}>{errors[`passenger_${passenger.id}_cardType`]}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        ID Number <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={passenger.cardNum || ''}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'cardNum', e.target.value)}
                                        placeholder="e.g. AB1360538"
                                        className={`${styles.input} ${errors[`passenger_${passenger.id}_cardNum`] ? styles.inputError : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_cardNum`] && (
                                        <p className={styles.errorText}>{errors[`passenger_${passenger.id}_cardNum`]}</p>
                                    )}
                                </div>
                                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                                    <label className={styles.label}>
                                        ID Expiry Date <span className={styles.required}>*</span>
                                    </label>
                                    <DateInput
                                        className={styles.dateInput}
                                        minDate={new Date()}
                                        placeholder="Document Expiry"
                                        valueFormat="YYYY-MM-DD"
                                        clearable
                                        error={errors[`passenger_${passenger.id}_cardExpiredDate`]}
                                        value={passenger.cardExpiredDate}
                                        onChange={(date) => handlePassengerChange(passenger.id, 'cardExpiredDate', date)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.formCard}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardIcon} aria-hidden>
                        <FaCreditCard size={14} />
                    </span>
                    <h3 className={styles.cardTitle}>Payment Method</h3>
                </div>
                <div className={styles.paymentGrid}>
                    <button
                        type="button"
                        className={`${styles.paymentOption} ${styles.paymentActive}`}
                        onClick={() => setPaymentMethod('card')}
                    >
                        <FaCreditCard size={16} />
                        Debit / Credit Card
                    </button>
                </div>
            </div>
            </>
            )}

            {isOverview && (
                <div className={`${styles.formCard} mt-3`}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Passenger overview</h2>
                        <div className={styles.passengerOverviewList}>
                            {[
                                {
                                    id: 'lead',
                                    ...leadPassenger,
                                    type: leadPassenger.type || 'adult',
                                },
                                ...passengers,
                            ].map((passenger, index) => {
                                const name = [passenger.firstName, passenger.lastName]
                                    .filter(Boolean)
                                    .join(' ')
                                    .trim();
                                const bagByLeg =
                                    ancillarySelections?.baggage?.byPassenger?.[passenger.id] || {};
                                const bagLegs = ancillarySelections?.baggage?.legs || [];
                                const bagItems = Object.entries(bagByLeg).filter(
                                    ([, bag]) => bag?.ancillary_key
                                );
                                const roleLabel =
                                    index === 0
                                        ? `Lead Passenger - ${getPassengerTypeLabel(passenger.type)}`
                                        : `Passenger ${index + 1} - ${getPassengerTypeLabel(passenger.type)}`;

                                return (
                                    <div key={passenger.id} className={styles.passengerOverviewCard}>
                                        <div className={styles.passengerOverviewHeader}>
                                            <p className={styles.passengerOverviewName}>
                                                {name || `Passenger ${index + 1}`}
                                            </p>
                                            <span className={styles.passengerOverviewMeta}>
                                                {roleLabel}
                                            </span>
                                        </div>
                                        {bagItems.length > 0 && (
                                            <ul className={styles.passengerAddonList}>
                                                {bagItems.map(([legId, bag]) => {
                                                    const legLabel = bagLegs.find((leg) => leg.id === legId)?.label;
                                                    return (
                                                        <li
                                                            key={`${passenger.id}-${legId}-${bag.ancillary_key}`}
                                                            className={styles.passengerAddonRow}
                                                        >
                                                            <span>
                                                                <span className={styles.passengerAddonLabel}>
                                                                    Extra baggage{legLabel && bagLegs.length > 1 ? ` (${legLabel})` : ''}
                                                                </span>{' '}
                                                                {bag.baggage_weight
                                                                    ? String(bag.baggage_weight).toUpperCase()
                                                                    : bag.name || 'Paid bag'}
                                                            </span>
                                                            {bag.price != null && (
                                                                <PriceDisplay
                                                                    currency={bag.currency}
                                                                    price={bag.price}
                                                                />
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <div className={styles.importantSection}>
                        <h4 className={styles.importantTitle}>Important Information</h4>
                        <ul className={styles.importantList}>
                            <li>
                                Please arrive at the airport at least 3 hours before international
                                flights and 2 hours before domestic flights.
                            </li>
                            <li>
                                Valid passport and visa (if required) must be presented at check-in.
                            </li>
                            <li>
                                Baggage allowance is subject to airline terms and conditions.
                            </li>
                            <li>
                                Flight timings are subject to change. Please confirm with the airline
                                24 hours before departure.
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {isOverview && (
                <div className={styles.formCard}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon} aria-hidden>
                            <FaCreditCard size={14} />
                        </span>
                        <h3 className={styles.cardTitle}>Payment Method</h3>
                    </div>
                    <div className={styles.paymentGrid}>
                        <button
                            type="button"
                            className={`${styles.paymentOption} ${styles.paymentActive}`}
                            onClick={() => setPaymentMethod('card')}
                        >
                            <FaCreditCard size={16} />
                            Debit / Credit Card
                        </button>
                    </div>
                </div>
            )}

            {(isOverview || typeof onContinue !== 'function') && (
            <div className={styles.footer}>
            <div className={styles.termsRow}>
                <input
                    className={`${styles.termsCheckbox} ${errors.terms ? styles.inputError : ''}`}
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (e.target.checked && errors.terms) {
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.terms;
                                return newErrors;
                            });
                        }
                    }}
                />
                <label className={styles.termsLabel} htmlFor="terms">
                    I agree to the <Link href="/terms-and-conditions" target='_blank' className={styles.termsLink}>terms and conditions</Link>. and <Link href="/privacy-policy" target='_blank' className={styles.termsLink}>privacy policy</Link>. I understand the cancellation policy and booking terms.
                </label>
            </div>
                {errors.terms && <div className={styles.errorText}>{errors.terms}</div>}
            </div>
            )}
            <div className={styles.submitWrap}>
                <button
                    onClick={handleSubmit}
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isPassengersStep && continueLoading}
                >
                    {isPassengersStep && typeof onContinue === 'function'
                        ? continueLoading
                            ? 'Loading options…'
                            : 'Continue'
                        : 'Confirm Booking'}
                </button>
            </div>
        </div>
    )
}
