'use client'
import React, { useState, useEffect, useRef } from 'react'
import { IoPeopleOutline, IoPersonOutline } from 'react-icons/io5';
import { countryListLocal } from '@/util/CountryList';
import { Select } from '@mantine/core';
import Link from 'next/link';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { useCurrency } from '@/util/currency';
import { notifications } from '@mantine/notifications';
import { DateInput } from '@mantine/dates';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useRouter } from 'next/navigation';
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { getPassengerCount, getPassengerLabel } from './flightHelpers';
import styles from './Form.module.css';

export default function Form({ flightdata, onRegisterSubmit, onLoadingChange }) {
    // console.log('flightdata in checkout form', flightdata);
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
        phoneCode: '',
        phone: '',
        // passportNumber: '',
        // passportExpiry: '',
        type: 'adult'
    });
    const [errors, setErrors] = useState({});
    const [termsAccepted, setTermsAccepted] = useState(false);
    const handleSubmitRef = useRef(null);

    const criteriaTotal =
        (flightdata?.search_criteria?.adult || 0) +
        (flightdata?.search_criteria?.child || 0) +
        (flightdata?.search_criteria?.infant || 0);
    const totalPassengers = getPassengerCount(flightdata) || criteriaTotal || passengers.length + 1;
    const passengerLabel = getPassengerLabel(flightdata);

    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }));

    useEffect(() => {
        if (flightdata?.search_criteria) {
            const passengerList = [];
            let passengerId = 1;
            const { adult, child, infant } = flightdata.search_criteria;
            // Count passenger types
            const counts = { adult: adult || 0, child: child || 0, infant: infant || 0 };

            // Skip first adult as it's the lead passenger
            if (counts.adult > 0) {
                for (let i = 1; i < counts.adult; i++) {
                    passengerList.push({
                        id: passengerId++,
                        type: 'adult',
                        title: '',
                        firstName: '',
                        lastName: '',
                        gender: 'male',
                        dob: '',
                        email: '',
                        country: '',
                        phoneCode: '',
                        phone: '',
                        // passportNumber: '',
                        // passportExpiry: ''
                    });
                }
            }

            // Add children
            if (counts.child > 0) {
                for (let i = 0; i < counts.child; i++) {
                    passengerList.push({
                        id: passengerId++,
                        type: 'child',
                        title: '',
                        firstName: '',
                        lastName: '',
                        gender: 'male',
                        dob: '',
                        email: '',
                        country: '',
                        phoneCode: '',
                        phone: '',
                        // passportNumber: '',
                        // passportExpiry: ''
                    });
                }
            }

            // Add infants
            if (counts.infant > 0) {
                for (let i = 0; i < counts.infant; i++) {
                    passengerList.push({
                        id: passengerId++,
                        type: 'infant_without_seat',
                        title: '',
                        firstName: '',
                        lastName: '',
                        gender: 'male',
                        dob: '',
                        country: '',
                        phoneCode: '',
                        email: '',
                        phone: '',
                        // passportNumber: '',
                        // passportExpiry: ''
                    });
                }
            }

            setPassengers(passengerList);
        }
    }, [flightdata]);
    useEffect(() => {
        const callCurrencyAPI = async () => {
            if (!flightdata?.id) return;
            var APiCurrency = currency;
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
                        model_id: flightdata?.id,
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
    }, [currency, flightdata?.id]);

    const getPassengerTypeLabel = (type) => {
        if (type === 'adult') return 'Adult';
        if (type === 'child') return 'Child';
        if (type === 'infant_without_seat') return 'Infant';
        return type;
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validateField = (name, value, isLeadPassenger = true, passengerData = null) => {
        if (!value || value.trim() === '') {
            return `${name.replace(/([A-Z])/g, ' $1').trim()} is required`;
        }

        if (name === 'email' && isLeadPassenger && !validateEmail(value)) {
            return 'Please enter a valid email address';
        }

        if (name === 'phone') {
            const phoneCode = isLeadPassenger ? leadPassenger.phoneCode : passengerData?.phoneCode;
            const phone = isLeadPassenger ? leadPassenger.phone : passengerData?.phone;

            if (phoneCode && phone) {
                const phoneNumber = isValidPhoneNumber(phoneCode + phone);
                if (!phoneNumber) {
                    return 'Please enter a valid phone number';
                }
            }
        }

        if (name === 'passportNumber' && value.length < 6) {
            return 'Passport number must be at least 6 characters';
        }

        return '';
    };

    const handleLeadPassengerChange = (field, value) => {
        // Only allow alphabets and spaces for name fields
        let finalValue = value;
        if (field === 'firstName' || field === 'lastName') {
            finalValue = value.replace(/[^a-zA-Z\s]/g, '');
        }

        setLeadPassenger(prev => ({ ...prev, [field]: finalValue }));

        // Clear error for this field
        if (errors[`lead_${field}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`lead_${field}`];
                return newErrors;
            });
        }
    };

    const handleLeadCountryChange = (value) => {
        const country = countryOptions.find(c => c.value === value);
        setLeadPassenger(prev => ({
            ...prev,
            country: value,
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
            // Only allow alphabets and spaces for name fields
            finalValue = value.replace(/[^a-zA-Z\s]/g, '');
        }

        setPassengers(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: finalValue } : p
        ));

        // Clear error for this field
        if (errors[`passenger_${id}_${field}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`passenger_${id}_${field}`];
                return newErrors;
            });
        }
    };

    const handlePassengerCountryChange = (id, value) => {
        const country = countryOptions.find(c => c.value === value);
        setPassengers(prev => prev.map(p =>
            p.id === id ? { ...p, country: value, phoneCode: country?.code || '' } : p
        ));

        if (errors[`passenger_${id}_country`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`passenger_${id}_country`];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate lead passenger
        const leadFields = ['title', 'firstName', 'lastName', 'email', 'dob', 'gender', 'country', 'phone'];
        leadFields.forEach(field => {
            const error = validateField(field, leadPassenger[field], true);
            if (error) {
                newErrors[`lead_${field}`] = error;
            }
        });

        // Validate other passengers
        passengers.forEach(passenger => {
            const passengerFields = ['title', 'firstName', 'lastName', 'gender', 'dob', 'country', 'email', 'phone'];
            passengerFields.forEach(field => {
                const error = validateField(field, passenger[field], false, passenger);
                if (error) {
                    newErrors[`passenger_${passenger.id}_${field}`] = error;
                }
            });
        });

        // Validate terms
        if (!termsAccepted) {
            newErrors['terms'] = 'You must accept the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (validateForm()) {
            setConfirmStatus("pending");
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setConfirmStatus("validate");

            // Calculate currency conversion
            const packageCurrency = flightdata?.pricing?.currency || 'GBP';
            const grandTotal = Number(flightdata?.pricing?.total_amount);

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

            // Create passengers array with lead passenger at index 0
            const passengersArray = [];

            // Add lead passenger first (index 0)
            passengersArray.push({
                type: leadPassenger.type || "adult",
                title: leadPassenger.title.toLowerCase(),
                firstName: leadPassenger.firstName,
                lastName: leadPassenger.lastName,
                dateOfBirth: leadPassenger.dob,
                gender: leadPassenger.gender === 'male' ? 'm' : 'f',
                email: leadPassenger.email,
                phone: `${leadPassenger.phoneCode}${leadPassenger.phone}`
            });

            // Add other passengers
            passengers.forEach(passenger => {
                passengersArray.push({
                    type: passenger.type,
                    title: passenger.title.toLowerCase(),
                    firstName: passenger.firstName,
                    lastName: passenger.lastName,
                    dateOfBirth: passenger.dob,
                    gender: passenger.gender === 'male' ? 'm' : 'f',
                    email: passenger.email,
                    phone: `${passenger.phoneCode}${passenger.phone}`
                });
            });

            const request = {
                booking_type: "hold",
                currency_uuid: currencyKey,
                trip_type: flightdata?.search_criteria?.AirTripType === 'MultiCity' ? 'multi_city' : (flightdata?.search_criteria?.AirTripType === 'OneWay' ? 'one_way' : 'return'),
                provider: flightdata.provider,
                offer_id: flightdata.id,
                passengers: passengersArray,
                grand_total: grandTotal,
                customer_currency: customerCurrency,
                customer_exchange_rate: customerExchangeRate,
                customer_amount: customerTotalAfterDiscount,
            };
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking`, {
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
                    await handlePayment(response?.data);
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
        } else {
            // Scroll to first error
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

    handleSubmitRef.current = handleSubmit;

    useEffect(() => {
        if (onRegisterSubmit) {
            onRegisterSubmit(() => handleSubmitRef.current?.());
        }
    }, [onRegisterSubmit]);

    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(loading);
        }
    }, [loading, onLoadingChange]);

    return (
        <div className={styles.formWrapper}>
            <LeadDetail setFormData={setLeadPassenger} module="flight" />
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Flight"
                />
            )}

            <div className="checkout-form-note">
                Enter the names exactly as they appear in your passport/ID to avoid check-in complications.
            </div>

            {totalPassengers > 0 && (
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
                        <span className="checkout-passenger-count">{totalPassengers}</span>
                        <span className="checkout-passenger-label">
                            passenger{totalPassengers !== 1 ? 's' : ''}
                            {passengerLabel ? ` (${passengerLabel})` : ''}
                        </span>
                    </div>
                </div>
            )}

            <div className="checkout-form-card">
                <div className="checkout-form-card-header">
                    <div className="checkout-form-card-icon">
                        <IoPersonOutline />
                    </div>
                    <div>
                        <h5>Lead Passenger Details</h5>
                        <p>Please provide correct contact information for booking confirmations.</p>
                    </div>
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
                                className={`${styles.select} ${errors.lead_title ? `is-invalid ${styles.inputError}` : ''}`}
                            >
                                <option value="">Select</option>
                                <option value="MR">Mr</option>
                                <option value="MRS">Mrs</option>
                                <option value="MISS">Miss</option>
                                <option value="MS">Ms</option>
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
                                className={`${styles.input} ${errors.lead_firstName ? `is-invalid ${styles.inputError}` : ''}`}
                                placeholder="First Name"
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
                                className={`${styles.input} ${errors.lead_lastName ? `is-invalid ${styles.inputError}` : ''}`}
                                placeholder="Last Name"
                            />
                            {errors.lead_lastName && <p className={styles.errorText}>{errors.lead_lastName}</p>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadEmail" className={styles.label}>
                                Email <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="email"
                                id="leadEmail"
                                value={leadPassenger.email}
                                onChange={(e) => handleLeadPassengerChange('email', e.target.value)}
                                className={`${styles.input} ${errors.lead_email ? `is-invalid ${styles.inputError}` : ''}`}
                                placeholder="you@example.com"
                            />
                            {errors.lead_email && <p className={styles.errorText}>{errors.lead_email}</p>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadDob" className={styles.label}>
                                Date of Birth <span className={styles.required}>*</span>
                            </label>
                            <DateInput
                                maxDate={new Date()}
                                placeholder="Date of Birth"
                                clearable="true"
                                error={errors.lead_dob}
                                value={leadPassenger.dob}
                                onChange={(date) => handleLeadPassengerChange('dob', date)}
                                classNames={{ root: styles.dateInput }}
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
                                        onChange={(e) => handleLeadPassengerChange('gender', e.target.value)}
                                    />
                                    Female
                                </label>
                            </div>
                            {errors.lead_gender && <p className={styles.errorText}>{errors.lead_gender}</p>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadCountry" className={styles.label}>
                                Country <span className={styles.required}>*</span>
                            </label>
                            <Select
                                id="leadCountry"
                                placeholder="Select Country"
                                searchable
                                value={leadPassenger.country}
                                onChange={handleLeadCountryChange}
                                data={countryOptions}
                                limit={50}
                                error={errors.lead_country}
                                classNames={{ root: styles.selectInput }}
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
                                    className={`${styles.input} ${styles.phoneInput} ${errors.lead_phone ? 'is-invalid' : ''}`}
                                    placeholder="1234567890"
                                    autoComplete="off"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                            </div>
                            {errors.lead_phone && <p className={styles.errorText}>{errors.lead_phone}</p>}
                        </div>
                    </div>

                    <p className={styles.sectionNote}>
                        This information will be used for all booking confirmations and communications. Ensure that the name matches travel documents.
                    </p>
            </div>

                {passengers.length > 0 && (
                    <div className="checkout-form-card">
                        <div className="checkout-form-card-header">
                            <div className="checkout-form-card-icon">
                                <IoPeopleOutline />
                            </div>
                            <div>
                                <h5>Other Passengers</h5>
                                <p>Enter details exactly as shown on passport or government-issued ID.</p>
                            </div>
                        </div>

                        {passengers.map((passenger, index) => (
                            <div key={passenger.id} className={styles.passengerBlock}>
                                <div className={styles.passengerHeader}>
                                    <h3 className={styles.passengerTitle}>Passenger {index + 2}</h3>
                                    <span className={styles.passengerBadge}>{getPassengerTypeLabel(passenger.type)}</span>
                                </div>

                                <div className={styles.fieldGrid}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label}>
                                            Title <span className={styles.required}>*</span>
                                        </label>
                                        <select
                                            value={passenger.title}
                                            onChange={(e) => handlePassengerChange(passenger.id, 'title', e.target.value)}
                                            className={`${styles.select} ${errors[`passenger_${passenger.id}_title`] ? `is-invalid ${styles.inputError}` : ''}`}
                                        >
                                            <option value="">Select</option>
                                            <option value="MR">Mr</option>
                                            <option value="MRS">Mrs</option>
                                            <option value="MISS">Miss</option>
                                            <option value="MS">Ms</option>
                                            <option value="DR">Dr</option>
                                            <option value="MSTR">Master</option>
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
                                            placeholder="First Name"
                                            className={`${styles.input} ${errors[`passenger_${passenger.id}_firstName`] ? `is-invalid ${styles.inputError}` : ''}`}
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
                                            placeholder="Last Name"
                                            className={`${styles.input} ${errors[`passenger_${passenger.id}_lastName`] ? `is-invalid ${styles.inputError}` : ''}`}
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
                                            maxDate={new Date()}
                                            placeholder="Date of Birth"
                                            clearable="true"
                                            error={errors[`passenger_${passenger.id}_dob`]}
                                            value={passenger.dob}
                                            onChange={(date) => handlePassengerChange(passenger.id, 'dob', date)}
                                            classNames={{ root: styles.dateInput }}
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
                                            placeholder="Email"
                                            className={`${styles.input} ${errors[`passenger_${passenger.id}_email`] ? `is-invalid ${styles.inputError}` : ''}`}
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
                                            placeholder="Select Country"
                                            searchable
                                            value={passenger.country}
                                            onChange={(value) => handlePassengerCountryChange(passenger.id, value)}
                                            data={countryOptions}
                                            limit={50}
                                            error={errors[`passenger_${passenger.id}_country`]}
                                            classNames={{ root: styles.selectInput }}
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
                                                value={passenger.phone}
                                                onChange={(e) => handlePassengerChange(passenger.id, 'phone', e.target.value)}
                                                className={`${styles.input} ${styles.phoneInput} ${errors[`passenger_${passenger.id}_phone`] ? 'is-invalid' : ''}`}
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
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.importantSection}>
                    <h3 className={styles.importantTitle}>Important Information</h3>
                    <ul className={styles.importantList}>
                        <li>Please arrive at the airport at least 3 hours before international flights and 2 hours before domestic flights.</li>
                        <li>Valid passport and visa (if required) must be presented at check-in.</li>
                        <li>Check-in closes 60 minutes before departure for international flights and 45 minutes for domestic flights.</li>
                        <li>Baggage allowance is subject to airline terms and conditions.</li>
                        <li>Flight timings are subject to change. Please confirm with the airline 24 hours before departure.</li>
                        <li>This is an electronic ticket. No paper ticket is required for travel.</li>
                    </ul>
                </div>

                <div className={styles.footer}>
                    <div className={styles.termsRow}>
                        <input
                            className={`${styles.termsCheckbox} ${errors.terms ? 'is-invalid' : ''}`}
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
                            I agree to the{' '}
                            <Link href="/terms-and-conditions" target="_blank" className={styles.termsLink}>
                                terms and conditions
                            </Link>
                            . <span className={styles.required}>*</span>
                        </label>
                    </div>
                    {errors.terms && <p className={styles.errorText}>{errors.terms}</p>}

                    <button
                        type="button"
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Confirm Booking'}
                    </button>
                </div>
        </div>
    )
}
