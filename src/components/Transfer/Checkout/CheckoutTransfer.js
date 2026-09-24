'use client'
import React, { useState, useEffect } from 'react'
import { countryListLocal } from '@/util/CountryList';
import { Select } from "@mantine/core";
import { TiDeleteOutline } from "react-icons/ti";
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useCurrency } from '@/util/currency';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { IoPersonAddOutline, IoShieldCheckmarkOutline, IoCopyOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { BiSupport } from 'react-icons/bi';
import { CiCircleCheck } from 'react-icons/ci';
import { FaUniversity, FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';
import { SiStripe } from 'react-icons/si';
import Link from 'next/link';
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import Autocomplete from "react-google-autocomplete";
import LocationPicker from './LocationPicker';
import LocationMapModal from './LocationMapModal';
import { useJsApiLoader } from '@react-google-maps/api';

const NAME_MAX = 35;
const EMAIL_MAX = 200;

/** Mr/Master → male; Mrs/Miss/Ms → female; Dr (and empty) → null (manual). */
function genderFromTitle(title) {
    const t = String(title || '').trim().toUpperCase();
    if (t === 'MR' || t === 'MSTR' || t === 'MASTER') return 'male';
    if (t === 'MRS' || t === 'MISS' || t === 'MS') return 'female';
    return null;
}

const normalizeName = (value) =>
    String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const fullNameKey = (first, last) => {
    const f = normalizeName(first);
    const l = normalizeName(last);
    if (!f || !l) return '';
    return `${f}|${l}`;
};

function computeNameErrors(leadFirst, leadLast, guests, { requireFilled = false } = {}) {
    const leadErrors = {};
    const guestErrors = guests.map(() => ({}));

    const lf = String(leadFirst || '').trim();
    const ll = String(leadLast || '').trim();
    const leadKey = fullNameKey(lf, ll);

    if (requireFilled && !lf) {
        leadErrors.firstName = 'First name is required.';
    } else if (lf.length > NAME_MAX) {
        leadErrors.firstName = `First name must be ${NAME_MAX} characters or fewer.`;
    }

    if (requireFilled && !ll) {
        leadErrors.lastName = 'Last name is required.';
    } else if (ll.length > NAME_MAX) {
        leadErrors.lastName = `Last name must be ${NAME_MAX} characters or fewer.`;
    }

    if (lf && ll && normalizeName(lf) === normalizeName(ll)) {
        leadErrors.lastName = 'First name and last name cannot be the same.';
    }

    const guestKeys = guests.map((g) => fullNameKey(g.firstName, g.lastName));

    guests.forEach((guest, index) => {
        const gf = String(guest.firstName || '').trim();
        const gl = String(guest.lastName || '').trim();
        const gKey = guestKeys[index];
        const ge = guestErrors[index];

        if (requireFilled && !gf) {
            ge.firstName = 'First name is required';
        } else if (gf.length > NAME_MAX) {
            ge.firstName = `First name must be ${NAME_MAX} characters or fewer`;
        }

        if (requireFilled && !gl) {
            ge.lastName = 'Last name is required';
        } else if (gl.length > NAME_MAX) {
            ge.lastName = `Last name must be ${NAME_MAX} characters or fewer`;
        }

        if (gf && gl && normalizeName(gf) === normalizeName(gl)) {
            ge.lastName = 'First name and last name cannot be the same';
        }

        if (gKey) {
            if (leadKey && gKey === leadKey) {
                ge.firstName = 'Name cannot match the lead passenger';
                ge.lastName = 'Name cannot match the lead passenger';
                if (!leadErrors.firstName) leadErrors.firstName = 'Name cannot match another traveler';
                if (!leadErrors.lastName) leadErrors.lastName = 'Name cannot match another traveler';
            } else if (guestKeys.some((key, i) => i !== index && key && key === gKey)) {
                ge.firstName = 'Guest name cannot match another traveler';
                ge.lastName = 'Guest name cannot match another traveler';
            }
        }
    });

    return { leadErrors, guestErrors };
}

export default function CheckoutTransfer({ transferDetail }) {
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const { currency, rates } = useCurrency();
    const [totalPersons, setTotalPersons] = useState({ adults: 0 });
    const [otherGuestDetail, setOtherGuestDetail] = useState([]);
    const [otherGuestError, setOtherGuestError] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaderError, setLoaderError] = useState("");
    const [currencyKey, setCurrencyKey] = useState("");
    const [confirmStatus, setConfirmStatus] = useState("pending"); // "pending" | "booking" | "payment" | "success" | "error"
    const [formData, setFormData] = useState({
        title: "",
        address: "",
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        phoneCode: "",
        phone: "",
        requests: "",
        gender: "male",
        terms: false,
        flightNumber: "",
    });
    const [bookingOptionDetails, setBookingOptionDetails] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(null); // 'bank_transfer' | 'stripe'
    const [copiedField, setCopiedField] = useState(null);

    // Reset bank_transfer selection if provider is not custom
    useEffect(() => {
        if (paymentMethod === 'bank_transfer' && transferDetail?.provider !== 'custom') {
            setPaymentMethod(null);
        }
    }, [transferDetail?.provider]);

    // Location states
    const [pickupLocation, setPickupLocation] = useState({
        address: transferDetail?.searchParams?.pickupLocation || '',
        lat: transferDetail?.searchParams?.fromLat != null
            ? Number(transferDetail.searchParams.fromLat)
            : null,
        lng: transferDetail?.searchParams?.fromLng != null
            ? Number(transferDetail.searchParams.fromLng)
            : null,
    });
    const [dropoffLocation, setDropoffLocation] = useState({
        address: transferDetail?.searchParams?.dropoffLocation || '',
        lat: transferDetail?.searchParams?.toLat != null
            ? Number(transferDetail.searchParams.toLat)
            : null,
        lng: transferDetail?.searchParams?.toLng != null
            ? Number(transferDetail.searchParams.toLng)
            : null,
    });
    const [mapModal, setMapModal] = useState({
        isOpen: false,
        type: null, // 'pickup' or 'dropoff'
        initialLocation: null
    });

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
    });

    // Check if pickup or dropoff location contains "airport"
    const isAirportTransfer = () => {
        const pickupLoc = transferDetail?.searchParams?.pickupLocation?.toLowerCase() || '';
        const dropoffLoc = transferDetail?.searchParams?.dropoffLocation?.toLowerCase() || '';
        return pickupLoc.includes('airport') || dropoffLoc.includes('airport');
    };

    const bankInfo = {
        accountName: "UmrahTech Ltd",
        accountNumber: "58516868",
        // iban: "GB29NWBK60161331926819",
        sortcode: "309950",
        // branch: "London Branch",
    };

    useEffect(() => {
        // Max additional guests = searched passengers − lead passenger (not vehicle capacity)
        const searchedPassengers = Math.max(
            Number(transferDetail?.searchParams?.passengers) || 1,
            1
        );
        const maxAdditionalGuests = Math.max(searchedPassengers - 1, 0);
        setTotalPersons({
            adults: maxAdditionalGuests,
            children: 0,
        });
        setOtherGuestDetail((prev) =>
            prev.length > maxAdditionalGuests ? prev.slice(0, maxAdditionalGuests) : prev
        );

        // Initialize location states from transferDetail
        if (transferDetail?.searchParams) {
            const sp = transferDetail.searchParams;
            setPickupLocation({
                address: sp.pickupLocation || '',
                lat: sp.fromLat != null ? Number(sp.fromLat) : null,
                lng: sp.fromLng != null ? Number(sp.fromLng) : null,
            });
            setDropoffLocation({
                address: sp.dropoffLocation || '',
                lat: sp.toLat != null ? Number(sp.toLat) : null,
                lng: sp.toLng != null ? Number(sp.toLng) : null,
            });
        }
    }, [transferDetail]);

    useEffect(() => {
        const callCurrencyAPI = async () => {
            if (!transferDetail?.id) return;
            var APiCurrency = currency;
            if (Object.keys(rates).length === 1) {
                APiCurrency = transferDetail?.currency;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/checkout/currency`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model_id: transferDetail?.id,
                        type: "transfer",
                        display_currency: APiCurrency,
                        model_currency: transferDetail?.currency,
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
    }, [currency, transferDetail?.id]);

    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }));
    // ---- Handle field change ----
    const syncLiveNameValidation = (nextForm, nextGuests) => {
        const { leadErrors, guestErrors } = computeNameErrors(
            nextForm.firstName,
            nextForm.lastName,
            nextGuests,
            { requireFilled: false }
        );

        setErrors((prev) => {
            const next = { ...prev };
            if (leadErrors.firstName) next.firstName = leadErrors.firstName;
            else delete next.firstName;
            if (leadErrors.lastName) next.lastName = leadErrors.lastName;
            else delete next.lastName;
            return next;
        });

        setOtherGuestError(
            nextGuests.map((_, index) => {
                const live = guestErrors[index] || {};
                return {
                    ...(live.firstName ? { firstName: live.firstName } : {}),
                    ...(live.lastName ? { lastName: live.lastName } : {}),
                };
            })
        );
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const nextValue = type === "checkbox" ? checked : value;

        if (name === 'gender' && genderFromTitle(formData.title)) {
            return;
        }

        const nextForm = {
            ...formData,
            [name]: nextValue,
        };

        if (name === 'title') {
            const autoGender = genderFromTitle(nextValue);
            if (autoGender) nextForm.gender = autoGender;
        }

        setFormData(nextForm);

        if (name === 'firstName' || name === 'lastName') {
            syncLiveNameValidation(nextForm, otherGuestDetail);
            return;
        }

        if (name === 'email' && String(nextValue).length > EMAIL_MAX) {
            setErrors((prev) => ({
                ...prev,
                email: `Email must be ${EMAIL_MAX} characters or fewer.`,
            }));
            return;
        }

        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    // ---- Handle address autocomplete selection ----
    const handlePlaceSelected = (place) => {
        if (!place || !place.formatted_address) return;

        // Get formatted address
        const address = place.formatted_address;

        // Extract country from address components
        const countryComponent = place.address_components?.find(
            (component) => component.types.includes("country")
        );

        if (countryComponent) {
            // Find matching country in our country list
            const countryName = countryComponent.long_name;
            const matchedCountry = countryOptions.find(
                (c) => c.value === countryName || c.label === countryName
            );

            if (matchedCountry) {
                setFormData({
                    ...formData,
                    address: address,
                    country: matchedCountry.value,
                    phoneCode: matchedCountry.code || "",
                });

                // Clear errors
                setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.address;
                    delete updated.country;
                    return updated;
                });
            } else {
                // Country not found in our list, just set address
                setFormData({
                    ...formData,
                    address: address,
                });

                if (errors.address) {
                    setErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.address;
                        return updated;
                    });
                }
            }
        } else {
            // No country component, just set address
            setFormData({
                ...formData,
                address: address,
            });

            if (errors.address) {
                setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.address;
                    return updated;
                });
            }
        }
    };

    // ---- Handle country selection ----
    const handleCountryChange = (value) => {
        const selected = countryOptions.find((c) => c.value === value);
        setFormData({
            ...formData,
            country: value,
            phoneCode: selected?.code || "",
        });

        if (errors.country) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated.country;
                return updated;
            });
        }
    };

    // ---- Validation ----
    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.title) newErrors.title = "Please select a title.";

        const { leadErrors, guestErrors: otherGuestErrors } = computeNameErrors(
            formData.firstName,
            formData.lastName,
            otherGuestDetail,
            { requireFilled: true }
        );
        Object.assign(newErrors, leadErrors);

        if (!formData.email) {
            newErrors.email = "Email is required.";
        } else if (String(formData.email).length > EMAIL_MAX) {
            newErrors.email = `Email must be ${EMAIL_MAX} characters or fewer.`;
        } else if (emailRegex.test(formData.email) === false) {
            newErrors.email = "Please enter a valid email address.";
        }
        if (!formData.country) newErrors.country = "Please select a country.";
        if (!formData.phone) newErrors.phone = "Phone number is required.";
        if (formData.phone) {
            if (formData.phone.length > 15 || formData.phone.length < 6) {
                newErrors.phone = "Phone number must be between 6 and 15 digits.";
            }
        }
        if (!formData.address) newErrors.address = "Address is required.";
        if (!pickupLocation.address || !pickupLocation.address.trim()) {
            newErrors.pickupLocation = "Pickup location is required.";
        } else if (pickupLocation.lat == null || pickupLocation.lng == null) {
            newErrors.pickupLocation = "Please select a pickup suggestion from the list.";
        }
        if (!dropoffLocation.address || !dropoffLocation.address.trim()) {
            if (transferDetail?.searchParams?.transferType !== 'all-round') {
                newErrors.dropoffLocation = "Dropoff location is required.";
            }
        } else if (
            transferDetail?.searchParams?.transferType !== 'all-round' &&
            (dropoffLocation.lat == null || dropoffLocation.lng == null)
        ) {
            newErrors.dropoffLocation = "Please select a dropoff suggestion from the list.";
        }
        if (isAirportTransfer() && !formData.flightNumber.trim()) {
            newErrors.flightNumber = "Flight number is required for airport transfers.";
        }
        // if (!formData.cardNumber) newErrors.cardNumber = "Card number is required.";
        // if (!formData.expiry) newErrors.expiry = "Expiry date is required.";
        // if (!formData.cvv) newErrors.cvv = "CVV is required.";
        if (!formData.terms) newErrors.terms = "You must agree to terms.";

        setOtherGuestError(otherGuestErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 && otherGuestErrors.every(err => Object.keys(err).length === 0);
    };

    const handleGuestAdd = () => {
        const totalAllowed = (totalPersons?.adults || 0) + (totalPersons?.children || 0);
        const currentAdults = otherGuestDetail.filter(g => g.type === 'AD').length;
        const currentChildren = otherGuestDetail.filter(g => g.type === 'CH').length;
        if (otherGuestDetail.length >= totalAllowed) {
            return;
        }
        setOtherGuestError([])
        if (currentAdults < (totalPersons?.adults || 0)) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', gender: 'male', type: 'AD' }]);
        } else if (currentChildren < (totalPersons?.children || 0)) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', gender: 'male', type: 'CH' }]);
        }

    };
    const handleGuestRemove = (index) => {
        const updatedGuests = otherGuestDetail.filter((_, i) => i !== index);
        setOtherGuestDetail(updatedGuests);
        syncLiveNameValidation(formData, updatedGuests);
    };
    const handleGuestChange = (e, index) => {
        let field = e.target.name;
        const value = e.target.value;

        // Normalize gender field
        if (field.startsWith("gender_")) {
            field = "gender";
        }

        const updatedGuests = [...otherGuestDetail];
        updatedGuests[index] = { ...updatedGuests[index], [field]: value };
        setOtherGuestDetail(updatedGuests);

        if (field === 'firstName' || field === 'lastName') {
            syncLiveNameValidation(formData, updatedGuests);
            return;
        }

        // Clear error if exists
        const updatedErrors = [...otherGuestError];
        if (updatedErrors[index]?.[field]) {
            updatedErrors[index] = { ...updatedErrors[index], [field]: "" };
            setOtherGuestError(updatedErrors);
        }
    };
    // ---- Submit handler ----
    const handleCheckout = async () => {
        if (!paymentMethod) {
            notifications.show({ title: 'Payment Method Required', message: 'Please select a payment method to continue.', autoClose: 3000, color: 'yellow' });
            return;
        }
        if (!validateForm()) {
            requestAnimationFrame(() => {
                document.querySelector('.is-invalid, .text-danger')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            });
            return;
        }
        setConfirmStatus("pending");
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConfirmStatus("validate");
        var NewOtherPassenger = {};
        if (otherGuestDetail.length > 0) {
            NewOtherPassenger = convertPassengers(otherGuestDetail);
        }

        // Calculate currency conversion
        const packageCurrency = transferDetail?.currency || 'GBP';
        const bookedQty = Math.max(1, Number(transferDetail?.quantity) || 1);
        const grandTotal = bookedQty * Number(transferDetail?.fare || 0);

        let customerCurrency = currency;
        let customerExchangeRate = 1;
        let customerTotalAfterDiscount = grandTotal;

        // If currencies are different, convert the price
        if (currency !== packageCurrency && rates[packageCurrency] && rates[currency]) {
            const conversion = ConvertPrice(grandTotal, packageCurrency, currency, rates);
            customerCurrency = conversion.newcurrency;
            customerTotalAfterDiscount = parseFloat(conversion.newprice);

            // Calculate exchange rate
            customerExchangeRate = (rates[currency] / rates[packageCurrency]);
        } else {
            // Same currency, use original values
            customerCurrency = packageCurrency;
            customerExchangeRate = 1;
            customerTotalAfterDiscount = grandTotal;
        }
        const request = {
            booked_qty: transferDetail?.quantity || 1,
            flight_number: formData.flightNumber || '',
            exact_pickup_point: pickupLocation.address || '',
            exact_dropoff_point: dropoffLocation.address || '',
            currency_uuid: currencyKey,
            provider: transferDetail?.provider,
            transferId: transferDetail?.id,
            special_request: formData.requests,
            lead_title: formData?.title,
            lead_first_name: formData?.firstName,
            lead_last_name: formData?.lastName,
            email: formData?.email,
            address: formData?.address,
            country: formData?.country,
            // phone_code: formData?.phoneCode,
            payment_method: paymentMethod,
            phone_number: formData?.phoneCode + formData?.phone,
            gender: formData?.gender,
            guest_details: NewOtherPassenger,
            pickup_location: transferDetail?.searchParams?.pickupLocation,
            dropoff_location: transferDetail?.searchParams?.dropoffLocation,
            pickup_date: transferDetail?.searchParams?.pickupDate,
            pickup_time: transferDetail?.searchParams?.pickupTime,
            dropoff_date: transferDetail?.searchParams?.dropoffDate || "",
            dropoff_time: transferDetail?.searchParams?.dropoffTime || "",
            passengers: transferDetail?.searchParams?.passengers,
            transfer_type: transferDetail?.searchParams?.transferType,
            customer_currency: customerCurrency,
            customer_exchange_rate: customerExchangeRate,
            amount: customerTotalAfterDiscount,
        };
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            if (response?.success) {
                await new Promise(resolve => setTimeout(resolve, 800));
                setConfirmStatus("reserve");
                if (paymentMethod === 'bank_transfer') {
                    setConfirmStatus("success");
                    setTimeout(() => {
                        setLoading(false);
                        router.push(`/transfers/voucher/${response?.data?.booking_reference}`);
                    }, 800);
                } else {
                    await handlePayment(response?.data);
                }
            } else {
                setLoaderError(response?.Description);
                setConfirmStatus("error");
                setTimeout(() => {
                    setLoading(false);
                    notifications.show({
                        title: response.Title,
                        message: response?.Description,
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

    const handlePayment = async (data) => {
        const domain = window.location.origin;
        const checkoutUrl = window.location;
        const request = {
            'booking_reference': data?.booking_reference,
            'success_url': `${domain}/transfers/voucher/${data?.booking_reference}`,
            'cancel_url': `${checkoutUrl}`
        }
        localStorage.setItem('lead_details_fill', JSON.stringify(formData));
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking/checkout`, {
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

    const copyToClipboard = (text, field) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedField(field);
                setTimeout(() => setCopiedField(null), 2000);
            }).catch(() => fallbackCopy(text, field));
        } else {
            fallbackCopy(text, field);
        }
    };

    const fallbackCopy = (text, field) => {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        try {
            document.execCommand('copy');
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
        document.body.removeChild(el);
    };

    const convertPassengers = (list) => {
        return list.map((item) => ({
            first_name: item.firstName,
            last_name: item.lastName,
            gender: item.gender,
        }));
    };
    // Handle location picker changes
    const handlePickupLocationChange = (locationData) => {
        setPickupLocation(locationData);
        if (errors.pickupLocation) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated.pickupLocation;
                return updated;
            });
        }
    };

    const handleDropoffLocationChange = (locationData) => {
        setDropoffLocation(locationData);
        if (errors.dropoffLocation) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated.dropoffLocation;
                return updated;
            });
        }
    };

    // Handle map modal
    const handleOpenMap = (type, currentLocation) => {
        setMapModal({
            isOpen: true,
            type,
            initialLocation: currentLocation
        });
    };

    const handleMapSelectLocation = (locationData) => {
        if (mapModal.type === 'pickup') {
            handlePickupLocationChange(locationData);
        } else if (mapModal.type === 'dropoff') {
            handleDropoffLocationChange(locationData);
        }
    };

    const handleCloseMap = () => {
        setMapModal({
            isOpen: false,
            type: null,
            initialLocation: null
        });
    };

    // Render map modal component
    const renderMapModal = () => {
        const sp = transferDetail?.searchParams || {};
        const isPickup = mapModal.type === 'pickup';
        return (
            <LocationMapModal
                isOpen={mapModal.isOpen}
                onClose={handleCloseMap}
                locationdata={sp}
                onSelectLocation={handleMapSelectLocation}
                initialLocation={mapModal.initialLocation}
                title={isPickup ? 'Select Pickup Location' : 'Select Dropoff Location'}
                boundLat={isPickup ? sp.fromLat : sp.toLat}
                boundLng={isPickup ? sp.fromLng : sp.toLng}
                boundLabel={isPickup ? sp.pickupLocation : sp.dropoffLocation}
            />
        );
    };

    return (

        <div>
            <LeadDetail setFormData={setFormData} />
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Transfer"
                />
            )}

            {/* Map Modal */}
            {isLoaded ? (
                <>
                    {renderMapModal()}
                    {/* Pickup and Dropoff Locations */}
                    <div className="rounded border p-3 mb-3">
                        <h5 className="mb-3">Pickup and Dropoff Locations</h5>
                        <div className="alert alert-info py-2 mb-3" role="alert">
                            <small>
                                <strong>Three ways to select location:</strong>
                                <ul className="mb-0 mt-1 ps-3">
                                    <li><strong>Type:</strong> Enter an address — suggestions are limited to your searched cities</li>
                                    <li><strong>GPS:</strong> Use your current position (must be within the searched city area)</li>
                                    <li><strong>Map:</strong> Pick on the map within the searched city area</li>
                                </ul>
                            </small>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <LocationPicker
                                    label="Pickup Location"
                                    value={pickupLocation.address}
                                    onChange={handlePickupLocationChange}
                                    error={errors.pickupLocation}
                                    placeholder="Enter pickup location"
                                    onOpenMap={(name, location) => handleOpenMap('pickup', location)}
                                    name="pickup"
                                    boundLat={transferDetail?.searchParams?.fromLat}
                                    boundLng={transferDetail?.searchParams?.fromLng}
                                    boundLabel={transferDetail?.searchParams?.pickupLocation}
                                    boundCountry={transferDetail?.searchParams?.fromCountry}
                                />
                            </div>

                            <div className="col-md-6">
                                <LocationPicker
                                    label="Dropoff Location"
                                    value={dropoffLocation.address}
                                    onChange={handleDropoffLocationChange}
                                    error={errors.dropoffLocation}
                                    placeholder="Enter dropoff location"
                                    onOpenMap={(name, location) => handleOpenMap('dropoff', location)}
                                    name="dropoff"
                                    boundLat={transferDetail?.searchParams?.toLat}
                                    boundLng={transferDetail?.searchParams?.toLng}
                                    boundLabel={transferDetail?.searchParams?.dropoffLocation}
                                    boundCountry={transferDetail?.searchParams?.toCountry || transferDetail?.searchParams?.fromCountry}
                                />
                            </div>
                            {/* Flight Number - Only show for airport transfers */}
                            {isAirportTransfer() && (
                                <div className="col-md-6">
                                    <label className="form-label">Flight Number*</label>
                                    <input
                                        type="text"
                                        name="flightNumber"
                                        value={formData.flightNumber}
                                        onChange={handleChange}
                                        className={`form-control ${errors.flightNumber ? "is-invalid" : ""}`}
                                        placeholder="e.g., BA123, EK456"
                                        autoComplete="off"
                                    />
                                    {errors.flightNumber && (
                                        <div className="invalid-feedback">{errors.flightNumber}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="rounded border p-3 mb-3">
                    <h5 className="mb-3">Pickup and Dropoff Locations</h5>
                    <div className="d-flex align-items-center gap-2 text-muted" style={{ minHeight: 80 }}>
                        <div className="spinner-border spinner-border-sm" role="status" />
                        <span>Loading map services...</span>
                    </div>
                </div>
            )}
            {/* Lead Guest Info */}
            <div className="rounded border p-3">
                <h5 className="mb-3">Lead Passenger Information</h5>

                <div className="row mb-4 g-3">
                    {/* Title */}
                    <div className="col-md-4">
                        <label className="form-label">Title*</label>
                        <select
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`form-select ${errors.title ? "is-invalid" : ""}`}
                        >
                            <option value="">Select</option>
                            <option value="MR">Mr</option>
                            <option value="MRS">Mrs</option>
                            <option value="MISS">Miss</option>
                            <option value="MS">Ms</option>
                            <option value="DR">Dr</option>
                        </select>
                        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>

                    {/* First Name */}
                    <div className="col-md-4">
                        <label className="form-label">First Name*</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                            placeholder="First Name"
                            autoComplete="off"
                            maxLength={35}
                        />
                        {errors.firstName && (
                            <div className="invalid-feedback">{errors.firstName}</div>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="col-md-4">
                        <label className="form-label">Last Name*</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                            placeholder="Last Name"
                            autoComplete="off"
                            maxLength={35}
                        />
                        {errors.lastName && (
                            <div className="invalid-feedback">{errors.lastName}</div>
                        )}
                    </div>

                    {/* Email */}
                    <div className="col-md-4">
                        <label className="form-label">Email*</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            placeholder="you@example.com"
                            autoComplete="off"
                            maxLength={200}
                        />
                        {errors.email && (
                            <div className="invalid-feedback">{errors.email}</div>
                        )}
                    </div>
                    {/* Address */}
                    <div className="col-md-4">
                        <label className="form-label">Address*</label>
                        {/* <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={`form-control ${errors.address ? "is-invalid" : ""}`}
                            placeholder="House No. / Street / Area"
                            autoComplete="off"
                        /> */}
                        <Autocomplete
                            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                            placeholder="House No. / Street "
                            className={`form-control ${errors.address ? "is-invalid" : ""}`}
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            onPlaceSelected={handlePlaceSelected}
                            options={{
                                types: ["address"],
                            }}
                        />
                        {errors.address && (
                            <div className="invalid-feedback">{errors.address}</div>
                        )}
                    </div>

                    {/* Country */}
                    <div className="col-md-4">
                        <label className="form-label">Country*</label>
                        <Select
                            placeholder="Select Country"
                            searchable
                            data={countryOptions}
                            value={formData.country}
                            limit={50}
                            onChange={handleCountryChange}
                            className={errors.country ? "is-invalid" : ""}
                        />
                        {errors.country && (
                            <div className="text-danger small mt-1">{errors.country}</div>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="col-md-4">
                        <label className="form-label">Phone Number*</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light">
                                {formData.phoneCode || "+__"}
                            </span>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (
                                        !/[0-9]/.test(e.key) &&
                                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                                placeholder="123456789"
                                autoComplete="off"
                            />
                        </div>
                        {errors.phone && (
                            <div className="invalid-feedback d-block">{errors.phone}</div>
                        )}
                    </div>

                    {/* Gender */}
                    <div className="col-md-4">
                        <label className="form-label">Gender*</label>
                        <div className="">
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" checked={formData.gender === "male"} type="radio" onChange={handleChange} name="gender" id="leadRadio1" value="male" disabled={!!genderFromTitle(formData.title)} />
                                <label className="form-check-label" htmlFor="leadRadio1">Male</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" checked={formData.gender === "female"} type="radio" onChange={handleChange} name="gender" id="leadRadio2" value="female" disabled={!!genderFromTitle(formData.title)} />
                                <label className="form-check-label" htmlFor="leadRadio2">Female</label>
                            </div>
                        </div>
                    </div>

                </div>

                <hr />
                <p className="text-muted small">
                    This information will be used for all booking confirmations and
                    communications. Ensure that the name matches travel documents.
                </p>
            </div>
            <div className="rounded border mt-3 p-3">
                {/* Other Guest Info — capped by searched passenger count (lead + guests) */}
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <button
                        type="button"
                        onClick={handleGuestAdd}
                        className="btn btn-primary btn-sm"
                        disabled={
                            otherGuestDetail.length >=
                            ((totalPersons?.adults || 0) + (totalPersons?.children || 0))
                        }
                    >
                        + Add New Guest
                    </button>
                    {/* <span className="text-muted small">
                        {otherGuestDetail.length} of{' '}
                        {(totalPersons?.adults || 0) + (totalPersons?.children || 0)} additional
                        guest{((totalPersons?.adults || 0) + (totalPersons?.children || 0)) === 1 ? '' : 's'}
                        {' '}(search: {Math.max(Number(transferDetail?.searchParams?.passengers) || 1, 1)} passengers)
                    </span> */}
                </div>
                {otherGuestDetail.map((item, index) => (
                    <div key={index} className="row my-4">
                        <div className="col-12 d-flex justify-content-between align-items-center">
                            <h5>Passenger {index + 2} {(item.type === 'CH' || item.type === 'IN') && <span style={{ fontSize: '12px' }} className="small bg-secondary-subtle rounded px-1 py-1">{item.type === 'CH' ? 'Child' : 'Infant'}</span>}</h5>
                            <TiDeleteOutline onClick={() => handleGuestRemove(index)} className="text-danger cursor-pointer" size={20} />
                        </div>
                        <div className="col-12 col-md-4">
                            <label>First Name</label>
                            <input type="text" name="firstName" onChange={(e) => handleGuestChange(e, index)} value={item.firstName} placeholder="First Name" maxLength={35} className={`form-control ${otherGuestError[index]?.firstName ? "is-invalid" : ""} `} />
                            {otherGuestError[index]?.firstName && <div className="invalid-feedback">{otherGuestError[index]?.firstName}</div>}
                        </div>
                        <div className="col-12 col-md-4">
                            <label>Last Name</label>
                            <input type="text" name="lastName" onChange={(e) => handleGuestChange(e, index)} value={item.lastName} placeholder="Last Name" maxLength={35} className={`form-control ${otherGuestError[index]?.lastName ? "is-invalid" : ""} `} />
                            {otherGuestError[index]?.lastName && <div className="invalid-feedback">{otherGuestError[index]?.lastName}</div>}
                        </div>
                        <div className="col-12 col-md-4">
                            <label className="form-label">Gender*</label>
                            <div className="">
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" checked={item.gender === "male"} type="radio" onChange={(e) => handleGuestChange(e, index)} name={`gender_${index}`} id={`male_${index}`} value="male" />
                                    <label className="form-check-label" htmlFor={`male_${index}`}>Male</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" checked={item.gender === "female"} type="radio" onChange={(e) => handleGuestChange(e, index)} name={`gender_${index}`} id={`female_${index}`} value="female" />
                                    <label className="form-check-label" htmlFor={`female_${index}`}>Female</label>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Special Requests */}
            <div className="rounded border mt-3 p-3">
                <h5>Special requests</h5>
                <p className="mt-3 small">
                  Special requests cannot be guaranteed, but we will do our best to fulfill them.
                </p>
                <p className="mb-0">Please write your requests in English (optional)</p>
                <textarea
                    className="form-control w-100"
                    rows={5}
                    name="requests"
                    value={formData.requests}
                    onChange={handleChange}
                ></textarea>
            </div>
            {/* Payment Method Selection */}
            <div className="rounded border mt-3 p-3">
                <h5 className="mb-1">Payment Method</h5>
                <p className="text-muted small mb-3">Select how you would like to pay for your booking.</p>

                <div className="row g-3 mb-4">
                    {/* Bank Transfer Option - only for custom provider */}
                    {transferDetail?.provider === 'custom' && <div className="col-md-6">
                        <div
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className="h-100"
                            style={{
                                border: `2px solid ${paymentMethod === 'bank_transfer' ? '#0d6efd' : '#dee2e6'}`,
                                borderRadius: '12px',
                                padding: '20px',
                                cursor: 'pointer',
                                background: paymentMethod === 'bank_transfer' ? '#f0f6ff' : '#fff',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                            }}
                        >
                            {paymentMethod === 'bank_transfer' && (
                                <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#0d6efd' }}>
                                    <IoCheckmarkCircleOutline size={22} />
                                </div>
                            )}
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <div style={{ width: 40, height: 40, borderRadius: '10px', background: paymentMethod === 'bank_transfer' ? '#0d6efd' : '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaUniversity size={18} color={paymentMethod === 'bank_transfer' ? '#fff' : '#6c757d'} />
                                </div>
                                <div>
                                    <div className="fw-semibold" style={{ fontSize: '15px' }}>Bank Transfer</div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>Pay directly to our bank account</div>
                                </div>
                            </div>
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                                Reserve now and transfer the amount. Your booking will be confirmed once payment is received.
                            </div>
                        </div>
                    </div>}

                    {/* Card Option */}
                    <div className={transferDetail?.provider === 'custom' ? 'col-md-6' : 'col-12'}>
                        <div
                            onClick={() => setPaymentMethod('stripe')}
                            className="h-100"
                            style={{
                                border: `2px solid ${paymentMethod === 'stripe' ? '#0d6efd' : '#dee2e6'}`,
                                borderRadius: '12px',
                                padding: '20px',
                                cursor: 'pointer',
                                background: paymentMethod === 'stripe' ? '#f0f6ff' : '#fff',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                            }}
                        >
                            {paymentMethod === 'stripe' && (
                                <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#0d6efd' }}>
                                    <IoCheckmarkCircleOutline size={22} />
                                </div>
                            )}
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <div style={{ width: 40, height: 40, borderRadius: '10px', background: paymentMethod === 'stripe' ? '#0d6efd' : '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaCreditCard size={18} color={paymentMethod === 'stripe' ? '#fff' : '#6c757d'} />
                                </div>
                                <div>
                                    <div className="fw-semibold" style={{ fontSize: '15px' }}>Debit / Credit Card</div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>Secure payment via Stripe</div>
                                </div>
                            </div>
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                                Pay instantly and securely using Visa, Mastercard, Amex and more. All transactions are encrypted.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Transfer Details */}
                {paymentMethod === 'bank_transfer' && (
                    <div style={{ borderRadius: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', padding: '20px' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <FaUniversity size={16} className="text-primary" />
                            <span className="fw-semibold">Bank Account Details</span>
                        </div>
                        <div className="row g-3 mb-3">
                            <div className="col-sm-6">
                                <div className="small text-muted mb-1">Account Name</div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-semibold">{bankInfo.accountName}</span>
                                    <button type="button" className="btn btn-sm p-0 text-secondary" style={{ lineHeight: 1 }} onClick={() => copyToClipboard(bankInfo.accountName, 'accountName')} title="Copy">
                                        {copiedField === 'accountName' ? <IoCheckmarkCircleOutline size={16} className="text-success" /> : <IoCopyOutline size={15} />}
                                    </button>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="small text-muted mb-1">Account Number</div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-semibold">{bankInfo.accountNumber}</span>
                                    <button type="button" className="btn btn-sm p-0 text-secondary" style={{ lineHeight: 1 }} onClick={() => copyToClipboard(bankInfo.accountNumber, 'accountNumber')} title="Copy">
                                        {copiedField === 'accountNumber' ? <IoCheckmarkCircleOutline size={16} className="text-success" /> : <IoCopyOutline size={15} />}
                                    </button>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="small text-muted mb-1">Sort Code</div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-semibold">{bankInfo.sortcode}</span>
                                    <button type="button" className="btn btn-sm p-0 text-secondary" style={{ lineHeight: 1 }} onClick={() => copyToClipboard(bankInfo.sortcode, 'sortcode')} title="Copy">
                                        {copiedField === 'sortcode' ? <IoCheckmarkCircleOutline size={16} className="text-success" /> : <IoCopyOutline size={15} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="alert alert-warning py-2 px-3 mb-3" style={{ fontSize: '13px', borderRadius: '8px' }}>
                            <strong>Important:</strong> After completing your bank transfer, please send the payment proof (screenshot or bank receipt) to our support team via email or WhatsApp. Include your booking reference number in the transfer description. Your booking will be confirmed once payment is verified.
                        </div>
                        {/* Terms */}
                        <div className="form-check mt-4">
                            <input
                                className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
                                type="checkbox"
                                id="transfer-terms-bank"
                                name="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="transfer-terms-bank">
                                I agree to the <Link target='_blank' href="/terms-and-conditions">terms and conditions</Link>.
                            </label>
                            {errors.terms && (
                                <div className="text-danger small mt-1">{errors.terms}</div>
                            )}
                        </div>
                        <div className="d-grid mt-3">
                            <button type="button" onClick={handleCheckout} className="btn-confirm-booking" disabled={loading}>
                                <FaUniversity className="me-2" />
                                {loading ? 'Processing...' : 'Reserve & Get Bank Details'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Stripe Card Details */}
                {paymentMethod === 'stripe' && (
                    <div style={{ borderRadius: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', padding: '20px' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <FaLock size={14} className="text-success" />
                            <span className="fw-semibold">Secure Card Payment</span>
                            <span className="ms-auto">
                                <SiStripe size={40} color="#635bff" />
                            </span>
                        </div>
                        <div className="small text-muted mb-3">
                            You will be securely redirected to Stripe's payment page to enter your card details. We accept Visa, Mastercard, American Express and more.
                        </div>
                        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                            <span className="badge bg-light border text-dark px-2 py-1" style={{ fontSize: '12px' }}><FaShieldAlt className="me-1 text-success" />256-bit SSL</span>
                            <span className="badge bg-light border text-dark px-2 py-1" style={{ fontSize: '12px' }}><FaLock className="me-1 text-success" />PCI DSS Compliant</span>
                            <span className="badge bg-light border text-dark px-2 py-1" style={{ fontSize: '12px' }}><IoShieldCheckmarkOutline className="me-1 text-success" />3D Secure</span>
                        </div>
                        <div className="small text-muted mb-3" style={{ fontSize: '12px' }}>
                            Your card details are never stored on our servers. All transactions are processed securely through Stripe.
                        </div>
                        {/* Terms */}
                        <div className="form-check mt-4">
                            <input
                                className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
                                type="checkbox"
                                id="transfer-terms-card"
                                name="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="transfer-terms-card">
                                I agree to the <Link target='_blank' href="/terms-and-conditions">terms and conditions</Link>.
                            </label>
                            {errors.terms && (
                                <div className="text-danger small mt-1">{errors.terms}</div>
                            )}
                        </div>
                        <div className="d-grid mt-3">
                            <button type="button" onClick={handleCheckout} className="btn-confirm-booking" disabled={loading}>
                                <FaLock className="me-2" />
                                {loading ? 'Processing...' : 'Pay Securely with Card'}
                            </button>
                        </div>
                    </div>
                )}

                {!paymentMethod && (
                    <div className="text-center text-muted py-2" style={{ fontSize: '13px' }}>
                        Please select a payment method above to continue.
                    </div>
                )}
            </div>
        </div>

    )
}
