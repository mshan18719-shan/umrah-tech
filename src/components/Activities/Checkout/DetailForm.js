'use client'
import React, { useState, useEffect, useRef } from 'react'
import { countryListLocal } from '@/util/CountryList';
import { Select } from "@mantine/core";
import { TiDeleteOutline } from "react-icons/ti";
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useCurrency } from '@/util/currency';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { IoPersonAddOutline, IoShieldCheckmarkOutline, IoPeopleOutline, IoPersonOutline, IoCardOutline } from 'react-icons/io5';
import Link from 'next/link';
import Autocomplete from "react-google-autocomplete";
import LeadDetail from '@/components/LeadDetail/LeadDetail';

const NAME_MAX = 35;
const EMAIL_MAX = 200;

function formatAgeRange(ageFrom, ageTo) {
    if (ageFrom == null && ageTo == null) return '';
    const to = ageTo != null && Number(ageTo) >= 999 ? '99+' : ageTo;
    if (ageFrom != null && to != null) return `(${ageFrom}-${to})`;
    if (ageFrom != null) return `(${ageFrom}+)`;
    return '';
}

/**
 * Free bands contribute 0; paid bands use amount from selected_pax.
 */
function calculateChildPrice(activityDetail) {
    const selectedPax = activityDetail?.modality?.selected_pax;
    if (Array.isArray(selectedPax) && selectedPax.length > 0) {
        const paidChildPax = selectedPax.find(
            (pax) =>
                (pax.paxType === 'CHILD' || pax.paxType === 'INFANT') &&
                Number(pax.amount || 0) > 0
        );
        if (paidChildPax) {
            return Number(paidChildPax.amount).toFixed(2);
        }
        const childPax = selectedPax.find(
            (pax) => pax.paxType === 'CHILD' || pax.paxType === 'INFANT'
        );
        if (childPax) {
            return Number(childPax.amount || 0).toFixed(2);
        }
    }
    return Number(activityDetail?.price_per_child || 0).toFixed(2);
}

function buildGuestFromPax(pax, type) {
    return {
        firstName: '',
        lastName: '',
        gender: 'male',
        type,
        ageFrom: pax?.ageFrom ?? null,
        ageTo: pax?.ageTo ?? null,
        paxType: pax?.paxType || null,
    };
}

/** Use ageTo for API (0–3 → 3, 4–12 → 12). */
function resolveChildAge(ageTo, ageFrom) {
    if (ageTo != null && Number(ageTo) < 999) return Number(ageTo);
    if (ageFrom != null) return Number(ageFrom);
    return 0;
}

/**
 * Build children_details from selected_pax quantities.
 * Names come from optional guest form entries; age always from the band's upper limit.
 */
function buildChildrenDetails(activityDetail, otherGuestDetail = []) {
    const selectedPax = activityDetail?.modality?.selected_pax;
    const enteredChildren = (otherGuestDetail || []).filter(
        (g) => g.type === 'CH' || g.type === 'IN'
    );
    const details = [];

    if (Array.isArray(selectedPax) && selectedPax.length > 0) {
        for (const pax of selectedPax) {
            if (pax.paxType !== 'CHILD' && pax.paxType !== 'INFANT') continue;
            const qty = Number(pax.quantity || 0);
            const age = resolveChildAge(pax.ageTo, pax.ageFrom);
            for (let i = 0; i < qty; i++) {
                const matchIdx = enteredChildren.findIndex(
                    (g) => g.ageFrom === pax.ageFrom && g.ageTo === pax.ageTo
                );
                let first_name = '';
                let last_name = '';
                if (matchIdx >= 0) {
                    const guest = enteredChildren.splice(matchIdx, 1)[0];
                    first_name = guest.firstName?.trim() || '';
                    last_name = guest.lastName?.trim() || '';
                }
                details.push({ age, first_name, last_name });
            }
        }
        return details;
    }

    const childrenCount = Number(activityDetail?.children || 0);
    for (let i = 0; i < childrenCount; i++) {
        const guest = enteredChildren[i];
        details.push({
            age: resolveChildAge(guest?.ageTo, guest?.ageFrom),
            first_name: guest?.firstName?.trim() || '',
            last_name: guest?.lastName?.trim() || '',
        });
    }
    return details;
}

/** Next child/infant age band still needing a guest slot. */
function getNextPaxSlot(activityDetail, otherGuestDetail, guestType) {
    const selectedPax = activityDetail?.modality?.selected_pax;
    if (!Array.isArray(selectedPax) || !selectedPax.length) {
        return { firstName: '', lastName: '', gender: 'male', type: guestType, ageFrom: null, ageTo: null };
    }

    const targetPaxTypes =
        guestType === 'CH' ? ['CHILD'] :
        guestType === 'IN' ? ['INFANT'] :
        ['ADULT', 'SENIOR'];

    for (const pax of selectedPax) {
        if (!targetPaxTypes.includes(pax.paxType)) continue;
        const needed = Number(pax.quantity || 0);
        const used = otherGuestDetail.filter(
            (g) =>
                g.type === guestType &&
                g.ageFrom === pax.ageFrom &&
                g.ageTo === pax.ageTo
        ).length;
        const leadOffset =
            guestType === 'AD' && (pax.paxType === 'ADULT' || pax.paxType === 'SENIOR')
                ? (selectedPax.findIndex(
                      (p) => p.paxType === 'ADULT' || p.paxType === 'SENIOR'
                  ) === selectedPax.indexOf(pax)
                    ? 1
                    : 0)
                : 0;
        if (used + leadOffset < needed) {
            return buildGuestFromPax(pax, guestType);
        }
    }

    return { firstName: '', lastName: '', gender: 'male', type: guestType, ageFrom: null, ageTo: null };
}

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

/** Live / submit name uniqueness + first≠last + length (no required checks when requireFilled=false). */
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

export default function DetailForm({ activityDetail, onRegisterSubmit, onLoadingChange, totalGuests = 0, guestLabel = '' }) {
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const { currency, rates } = useCurrency();
    const [totalPersons, setTotalPersons] = useState({ adults: 0, children: 0 });
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
    });
    const [bookingOptionDetails, setBookingOptionDetails] = useState('');
    const [questionAnswers, setQuestionAnswers] = useState({});
    const [questionPhoneMeta, setQuestionPhoneMeta] = useState({});
    const handleCheckoutRef = useRef(null);

    const activityQuestions = Array.isArray(activityDetail?.questions)
        ? activityDetail.questions
        : [];

    // Already captured on lead form — hide in Additional Details, still send in payload.
    const LEAD_DERIVED_QUESTION_CODES = [
        'LEAD_NAME',
        'PHONENUMBER',
        'TLFCONTACTO',
        'EMAILCONTACTO',
        'EMAIL',
        'NC-CTEL',
    ];

    const isPhoneQuestion = (question) => {
        const code = String(question?.code || '').toUpperCase();
        const text = String(question?.text || '').toLowerCase();
        return (
            code.includes('PHONE') ||
            code.includes('TLF') ||
            code.includes('CTEL') ||
            text.includes('telephone') ||
            text.includes('phone')
        );
    };

    const isEmailQuestion = (question) => {
        const code = String(question?.code || '').toUpperCase();
        const text = String(question?.text || '').toLowerCase();
        return code.includes('EMAIL') || text.includes('email');
    };

    const isLeadNameQuestion = (question) => {
        const code = String(question?.code || '').toUpperCase();
        const text = String(question?.text || '').toLowerCase();
        return (
            code === 'LEAD_NAME' ||
            code === 'NAME' ||
            ((text.includes('full name') ||
                text.includes('lead name') ||
                text.includes('passenger name')) &&
                !text.includes('hotel'))
        );
    };

    const isLeadDerivedQuestion = (question) => {
        if (!question?.code) return false;
        const code = String(question.code).toUpperCase();
        if (LEAD_DERIVED_QUESTION_CODES.includes(code)) return true;
        return (
            isEmailQuestion(question) ||
            isPhoneQuestion(question) ||
            isLeadNameQuestion(question)
        );
    };

    const getLeadDerivedAnswer = (question) => {
        if (isEmailQuestion(question)) {
            return (formData.email || '').trim();
        }
        if (isPhoneQuestion(question)) {
            return `${formData.phoneCode || ''}${formData.phone || ''}`
                .replace(/\s+/g, '')
                .trim();
        }
        if (isLeadNameQuestion(question)) {
            return [formData.title, formData.firstName, formData.lastName]
                .filter(Boolean)
                .join(' ')
                .trim();
        }
        const code = String(question?.code || '').toUpperCase();
        switch (code) {
            case 'EMAILCONTACTO':
            case 'EMAIL':
                return (formData.email || '').trim();
            case 'PHONENUMBER':
            case 'TLFCONTACTO':
            case 'NC-CTEL':
                return `${formData.phoneCode || ''}${formData.phone || ''}`
                    .replace(/\s+/g, '')
                    .trim();
            case 'LEAD_NAME':
            case 'NAME':
                return [formData.title, formData.firstName, formData.lastName]
                    .filter(Boolean)
                    .join(' ')
                    .trim();
            default:
                return '';
        }
    };

    const visibleQuestions = activityQuestions.filter(
        (q) => q?.code && !isLeadDerivedQuestion(q)
    );

    const getQuestionAnswerValue = (question) => {
        const code = question?.code;
        if (!code) return '';
        if (isLeadDerivedQuestion(question)) {
            return getLeadDerivedAnswer(question);
        }
        const raw = String(questionAnswers[code] || '').trim();
        if (!isPhoneQuestion(question)) return raw;
        const meta = questionPhoneMeta[code] || {};
        return `${meta.phoneCode || ''}${raw}`.replace(/\s+/g, '').trim();
    };

    const buildQuestionAnswersPayload = () =>
        activityQuestions
            .filter((q) => q?.code)
            .map((q) => ({
                code: q.code,
                answer: getQuestionAnswerValue(q),
            }));

    useEffect(() => {
        setTotalPersons({
            adults: Math.max((activityDetail?.adults || 0) - 1, 0),
            children: activityDetail?.children || 0,
        });
        setOtherGuestDetail([]);
        setOtherGuestError([]);

        const initialAnswers = {};
        const initialPhoneMeta = {};
        (Array.isArray(activityDetail?.questions) ? activityDetail.questions : []).forEach(
            (q) => {
                if (!q?.code) return;
                initialAnswers[q.code] = '';
                if (isPhoneQuestion(q)) {
                    initialPhoneMeta[q.code] = { country: '', phoneCode: '' };
                }
            }
        );
        setQuestionAnswers(initialAnswers);
        setQuestionPhoneMeta(initialPhoneMeta);
    }, [activityDetail]);

    useEffect(() => {
        if (onRegisterSubmit) {
            onRegisterSubmit(() => handleCheckoutRef.current?.());
        }
    }, [onRegisterSubmit]);

    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(loading);
        }
    }, [loading, onLoadingChange]);

    useEffect(() => {
        const callCurrencyAPI = async () => {
            if (!activityDetail?.id) return;
            var APiCurrency = currency;
            if (Object.keys(rates).length === 1) {
                APiCurrency = activityDetail?.currency;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/checkout/currency`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model_id: activityDetail?.id,
                        type: "activity",
                        display_currency: APiCurrency,
                        model_currency: activityDetail?.currency,
                    }),
                });
                const result = await response.json();
                if (result?.success) {
                    setCurrencyKey(result?.data?.uuid);
                }
            } catch (error) {
                console.error("Error calling currency API:", error);
            }
        };

        callCurrencyAPI();
    }, [currency, activityDetail]);

    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }));

    const handleQuestionChange = (code, value) => {
        setQuestionAnswers((prev) => ({
            ...prev,
            [code]: value,
        }));
        const errorKey = `question_${code}`;
        if (errors[errorKey]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[errorKey];
                return updated;
            });
        }
    };

    const handleQuestionPhoneChange = (code, rawValue) => {
        const digits = String(rawValue || '').replace(/[^\d+]/g, '');
        setQuestionAnswers((prev) => ({
            ...prev,
            [code]: digits,
        }));
        const errorKey = `question_${code}`;
        if (errors[errorKey]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[errorKey];
                return updated;
            });
        }
    };

    const handleQuestionCountryChange = (code, value) => {
        const selected = countryOptions.find((c) => c.value === value);
        setQuestionPhoneMeta((prev) => ({
            ...prev,
            [code]: {
                country: value || '',
                phoneCode: selected?.code || '',
            },
        }));
        setErrors((prev) => {
            const updated = { ...prev };
            delete updated[`question_${code}_country`];
            delete updated[`question_${code}`];
            return updated;
        });
    };

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
            // Replace live name errors; clear name fields when valid
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

        // Gender is locked unless title is Dr (or empty)
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

        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
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
        // if (!formData.cardNumber) newErrors.cardNumber = "Card number is required.";
        // if (!formData.expiry) newErrors.expiry = "Expiry date is required.";
        // if (!formData.cvv) newErrors.cvv = "CVV is required.";
        if (!formData.terms) newErrors.terms = "You must agree to terms.";

        visibleQuestions.forEach((q) => {
            if (!q?.code) return;
            const isRequired = q.required !== false;
            const errorKey = `question_${q.code}`;
            if (isPhoneQuestion(q)) {
                const phone = String(questionAnswers[q.code] || '').trim();
                const meta = questionPhoneMeta[q.code] || {};
                if (isRequired && !meta.country) {
                    newErrors[`${errorKey}_country`] = 'Please select a country.';
                }
                if (isRequired && !phone) {
                    newErrors[errorKey] = 'This field is required.';
                } else if (phone && (phone.length > 15 || phone.length < 6)) {
                    newErrors[errorKey] = 'Phone number must be between 6 and 15 digits.';
                }
                return;
            }
            if (isRequired && !String(questionAnswers[q.code] || '').trim()) {
                newErrors[errorKey] = 'This field is required.';
            }
        });

        setOtherGuestError(otherGuestErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 && otherGuestErrors.every(err => Object.keys(err).length === 0);
    };

    const handleGuestAdd = () => {
        const totalAllowed = totalPersons?.adults + totalPersons?.children;
        const currentAdults = otherGuestDetail.filter(g => g.type === 'AD').length;
        const currentChildren = otherGuestDetail.filter(g => g.type === 'CH').length;
        if (otherGuestDetail.length >= totalAllowed) {
            return;
        }
        setOtherGuestError([])
        if (currentAdults < totalPersons?.adults) {
            setOtherGuestDetail([
                ...otherGuestDetail,
                getNextPaxSlot(activityDetail, otherGuestDetail, 'AD'),
            ]);
        } else if (currentChildren < totalPersons?.children) {
            setOtherGuestDetail([
                ...otherGuestDetail,
                getNextPaxSlot(activityDetail, otherGuestDetail, 'CH'),
            ]);
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
        const packageCurrency = activityDetail?.currency;
        const grandTotal = Number(activityDetail?.grand_total);

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

        const modality = activityDetail?.modality;
        const request = {
            activity_id: activityDetail?.id,
            currency_uuid: currencyKey,
            special_request: formData.requests,
            lead_title: formData?.title,
            lead_first_name: formData?.firstName,
            lead_last_name: formData?.lastName,
            lead_email: formData?.email,
            lead_address: formData?.address,
            lead_country: formData?.country,
            lead_phone_code: formData?.phoneCode,
            lead_phone: formData?.phone,
            lead_gender: formData?.gender,
            travel_date: activityDetail?.travel_date,
            adults: activityDetail?.adults,
            adult_price: Number(activityDetail?.price_per_adult || 0).toFixed(2),
            children: activityDetail?.children,
            child_price: calculateChildPrice(activityDetail),
            grand_total: grandTotal,
            other_passengers: NewOtherPassenger,
            customer_currency: customerCurrency,
            customer_exchange_rate: customerExchangeRate,
            customer_total: customerTotalAfterDiscount,
            additional_services: activityDetail?.selected_services || [],
            payment_method: 'stripe',
            provider: activityDetail?.provider,
            language: modality?.language?.code || '',
            languagedescription: modality?.language?.description || '',
            ...(modality?.code ? { modality_code: modality.code } : {}),
            ...(modality?.rate_key ? { rate_key: modality.rate_key } : {}),
            children_details: buildChildrenDetails(activityDetail, otherGuestDetail),
            question_answers: buildQuestionAnswersPayload(),
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            const bookingOk = response?.Success || response?.success;
            const content = response?.Content || response?.data;
            if (bookingOk) {
                await new Promise(resolve => setTimeout(resolve, 800));
                setConfirmStatus("reserve");
                await handlePayment(content);
            } else {
                setLoaderError(response?.error?.message || response?.Description || "Booking failed. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setLoading(false);
                    notifications.show({
                        title: 'Error',
                        message: response?.error?.message || response?.Description || 'Booking failed. Please try again.',
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
        const bookingRef = data?.booking?.booking_reference || data?.booking_reference;
        const request = {
            'booking_reference': bookingRef,
            'success_url': `${domain}/activities/voucher/${bookingRef}`,
            'cancel_url': `${checkoutUrl}`
        }
        localStorage.setItem('lead_details_fill', JSON.stringify(formData));
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/payment/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            const paymentOk = response?.Success || response?.success;
            const paymentContent = response?.Content || response?.data;
            if (paymentOk) {
                setConfirmStatus("payment");
                setTimeout(() => {
                    setLoading(false);
                    router.push(paymentContent?.checkout_url);
                }, 800);

            } else {
                setLoaderError(response?.error?.message || "Payment failed. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setLoading(false);
                    notifications.show({
                        title: 'Error',
                        message: response?.error?.message || 'Payment failed. Please try again.',
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

    const convertPassengers = (list) => {
        const result = {
            additional_adults: [],
            children_details: [],
        };

        let adultIndex = 2;  // adult count starts from 2
        let childIndex = 1;  // child starts from 1

        list.forEach((item) => {
            const formatted = {
                index: null,
                gender: item.gender,
                last_name: item.lastName,
                first_name: item.firstName,
            };

            if (item.type === "AD") {
                formatted.index = adultIndex++;
                result.additional_adults.push(formatted);
            }

            if (item.type === "CH") {
                formatted.index = childIndex++;
                result.children_details.push(formatted);
            }
        });

        return result;
    };

    handleCheckoutRef.current = handleCheckout;

    return (
        <div>
            <LeadDetail setFormData={setFormData} />
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Activity"
                />
            )}
            {/* Number of Passengers */}
            {totalGuests > 0 && (
                <div className="checkout-form-card">
                    <div className="checkout-form-card-header">
                        <div className="checkout-form-card-icon">
                            <IoPeopleOutline />
                        </div>
                        <div>
                            <h5>Number of Passengers</h5>
                        </div>
                    </div>
                    <div className="checkout-passenger-row">
                        <span className="checkout-passenger-count">{totalGuests}</span>
                        <span className="checkout-passenger-label">
                            passenger{totalGuests !== 1 ? 's' : ''}{guestLabel ? ` (${guestLabel})` : ''}
                        </span>
                    </div>
                </div>
            )}

            {/* Lead Guest Info */}
            <div className="checkout-form-card">
                <div className="checkout-form-card-header">
                    <div className="checkout-form-card-icon">
                        <IoPersonOutline />
                    </div>
                    <div>
                        <h5>Lead Passenger Details</h5>
                        <p>Primary contact for booking confirmations</p>
                    </div>
                </div>

                <div className="row mb-3 g-3">
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
                    <div className="col-md-6">
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
                    <div className="col-md-6">
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
                                        e.preventDefault(); // 👈 yahin block hota hai
                                    }
                                }}
                                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                                placeholder="123456789"
                                autoComplete="off"
                            />
                        </div>
                        {errors.phone && (
                            <div className="invalid-feedback d-block small">{errors.phone}</div>
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

                <p className="checkout-form-note">
                    This information will be used for all booking confirmations and
                    communications. Ensure that the name matches travel documents.
                </p>
            </div>

            {/* Other Guest Info */}
            <div className="checkout-form-card">
                <div className="checkout-form-card-header">
                    <div className="checkout-form-card-icon">
                        <IoPersonAddOutline />
                    </div>
                    <div>
                        <h5>Additional Travelers</h5>
                        <p>Add details for other guests in your group (optional)</p>
                    </div>
                </div>

                <button type="button" onClick={handleGuestAdd} className="btn-add-guest">
                    <IoPersonAddOutline size={16} /> Add New Guest
                </button>

                {otherGuestDetail.map((item, index) => (
                    <div key={index} className="guest-card">
                        <div className="guest-card-header">
                            <h6>
                                Traveler {index + 2}
                                {(item.type === 'CH' || item.type === 'IN') && (
                                    <span className="guest-type-badge">
                                        {item.type === 'CH' ? 'Child' : 'Infant'}
                                        {formatAgeRange(item.ageFrom, item.ageTo)
                                          ? ` ${formatAgeRange(item.ageFrom, item.ageTo)}`
                                          : ''}
                                    </span>
                                )}
                            </h6>
                            <TiDeleteOutline onClick={() => handleGuestRemove(index)} className="text-danger cursor-pointer" size={20} />
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-md-4">
                                <label className="form-label">First Name</label>
                                <input type="text" name="firstName" onChange={(e) => handleGuestChange(e, index)} value={item.firstName} placeholder="First Name" maxLength={35} className={`form-control ${otherGuestError[index]?.firstName ? "is-invalid" : ""}`} />
                                {otherGuestError[index]?.firstName && <div className="invalid-feedback">{otherGuestError[index]?.firstName}</div>}
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label">Last Name</label>
                                <input type="text" name="lastName" onChange={(e) => handleGuestChange(e, index)} value={item.lastName} placeholder="Last Name" maxLength={35} className={`form-control ${otherGuestError[index]?.lastName ? "is-invalid" : ""}`} />
                                {otherGuestError[index]?.lastName && <div className="invalid-feedback">{otherGuestError[index]?.lastName}</div>}
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label">Gender</label>
                                <div>
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
                    </div>
                ))}
            </div>

            {/* Additional Questions */}
            {visibleQuestions.length > 0 && (
                <div className="checkout-form-card">
                    <div className="checkout-form-card-header">
                        <div className="checkout-form-card-icon">
                            <IoShieldCheckmarkOutline />
                        </div>
                        <div>
                            <h5>Additional Details</h5>
                            <p>Please provide the required information for this activity</p>
                        </div>
                    </div>
                    <div className="row g-3">
                        {visibleQuestions.map((question) => {
                            const code = question.code;
                            const isRequired = question.required !== false;
                            const errorKey = `question_${code}`;
                            const countryErrorKey = `${errorKey}_country`;
                            const label = question.text || code;
                            const phoneQ = isPhoneQuestion(question);
                            const phoneMeta = questionPhoneMeta[code] || {};
                            const inputType =
                                String(code || '').toUpperCase().includes('EMAIL') ||
                                String(label).toLowerCase().includes('email')
                                    ? 'email'
                                    : 'text';

                            if (phoneQ) {
                                return (
                                    <React.Fragment key={code}>
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Country{isRequired ? '*' : ''}
                                            </label>
                                            <Select
                                                placeholder="Select Country"
                                                searchable
                                                data={countryOptions}
                                                value={phoneMeta.country || null}
                                                limit={50}
                                                onChange={(value) =>
                                                    handleQuestionCountryChange(code, value)
                                                }
                                                className={
                                                    errors[countryErrorKey] ? 'is-invalid' : ''
                                                }
                                            />
                                            {errors[countryErrorKey] && (
                                                <div className="text-danger small mt-1">
                                                    {errors[countryErrorKey]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                {label}
                                                {isRequired ? '*' : ''}
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    {phoneMeta.phoneCode || '+__'}
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={questionAnswers[code] || ''}
                                                    onChange={(e) =>
                                                        handleQuestionPhoneChange(code, e.target.value)
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.ctrlKey || e.metaKey || e.altKey) return;
                                                        if (
                                                            !/[0-9+]/.test(e.key) &&
                                                            ![
                                                                'Backspace',
                                                                'Delete',
                                                                'ArrowLeft',
                                                                'ArrowRight',
                                                                'Tab',
                                                                'Home',
                                                                'End',
                                                            ].includes(e.key)
                                                        ) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className={`form-control ${errors[errorKey] ? 'is-invalid' : ''}`}
                                                    placeholder={label}
                                                    autoComplete="tel"
                                                    inputMode="tel"
                                                />
                                            </div>
                                            {errors[errorKey] && (
                                                <div className="text-danger small mt-1">
                                                    {errors[errorKey]}
                                                </div>
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            }

                            return (
                                <div key={code} className="col-md-6">
                                    <label className="form-label">
                                        {label}
                                        {isRequired ? '*' : ''}
                                    </label>
                                    <input
                                        type={inputType}
                                        className={`form-control ${errors[errorKey] ? 'is-invalid' : ''}`}
                                        value={questionAnswers[code] || ''}
                                        onChange={(e) =>
                                            handleQuestionChange(code, e.target.value)
                                        }
                                        placeholder={label}
                                        autoComplete="off"
                                    />
                                    {errors[errorKey] && (
                                        <div className="text-danger small mt-1">
                                            {errors[errorKey]}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Special Requests */}
            <div className="checkout-form-card">
                <div className="checkout-form-card-header">
                    <div className="checkout-form-card-icon">
                        <IoShieldCheckmarkOutline />
                    </div>
                    <div>
                        <h5>Special Requests</h5>
                        <p>Let us know if you have any preferences (optional)</p>
                    </div>
                </div>
                <p className="small text-muted mb-2">
                    Special requests cannot be guaranteed — we&apos;ll do our best to fulfill them.
                </p>
                <textarea
                    className="form-control w-100"
                    rows={4}
                    name="requests"
                    value={formData.requests}
                    onChange={handleChange}
                    placeholder="Please write your requests in English..."
                ></textarea>
            </div>

            {/* Terms */}
            <div className="terms-check mt-2 mb-3">
                <div className="form-check">
                    <input
                        className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
                        type="checkbox"
                        name="terms"
                        id="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="terms">
                        I agree to the <Link target='_blank' href="/terms-and-conditions">Terms &amp; Conditions</Link> and{' '}
                        <Link target='_blank' href="/privacy-policy">Privacy Policy</Link>. I confirm all passenger details are correct.
                    </label>
                    {errors.terms && (
                        <div className="text-danger small mt-1">{errors.terms}</div>
                    )}
                </div>
            </div>

            {/* Payment Method — card only */}
            <div className="checkout-form-card">
                <div className="checkout-form-card-header">
                    <div className="checkout-form-card-icon">
                        <IoCardOutline />
                    </div>
                    <div>
                        <h5>Payment Method</h5>
                        <p>Pay securely with your debit or credit card</p>
                    </div>
                </div>

                <div className="payment-method-grid">
                    <button
                        type="button"
                        className="payment-method-btn payment-method-btn-active"
                    >
                        <IoCardOutline />
                        Debit / Credit Card
                    </button>
                </div>

                <p className="payment-method-note">
                    All card details are encrypted and processed through a secure payment gateway.
                    Your information remains completely safe and protected.
                </p>
            </div>

            <button
                type="button"
                className="btn-confirm-booking"
                onClick={handleCheckout}
                disabled={loading}
            >
                {loading ? 'Processing...' : 'Pay Securely with Card'}
            </button>

        </div>
    )
}
