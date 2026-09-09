'use client'
import React, { useState, useEffect } from 'react'
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
import styles from './Checkout.module.css';
export default function CheckoutForm({ packageData }) {
    const { currency, rates } = useCurrency();
    const router = useRouter();
    // Initialize passenger data from flight data
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(false);
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

    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }));

    useEffect(() => {
        if (packageData?.original_request) {
            const passengerList = [];
            let passengerId = 1;
            const { adult, child } = packageData.original_request;
            // Count passenger types
            const counts = { adult: adult || 0, child: child || 0 };

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

            setPassengers(passengerList);
        }
    }, [packageData]);

    const getPassengerTypeLabel = (type) => {
        if (type === 'adult') return 'Adult';
        if (type === 'child') return 'Child';
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
        setLeadPassenger(prev => ({ ...prev, [field]: value }));

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
        const finalValue = field === 'phone' ? value.replace(/[^0-9]/g, '') : value;

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
        e.preventDefault();
        if (validateForm()) {
            setConfirmStatus("pending");
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setConfirmStatus("validate");

            // Calculate currency conversion
            const packageCurrency = packageData?.pricing?.currency;
            const grandTotal = Number(packageData?.pricing?.total_price);

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
            const AdultArray = passengers
                .filter(p => p.type === 'adult')
                .map((p, i) => {
                    const { id, ...rest } = p; // remove id
                    return {
                        ...rest,
                        index: i + 1
                    };
                });

            const ChildArray = passengers
                .filter(p => p.type === 'child')
                .map((p, i) => {
                    const { id, ...rest } = p; // remove id
                    return {
                        ...rest,
                        index: i + 1
                    };
                });

            const request = {
                "package_id": packageData.package_id,
                "title": leadPassenger.title,
                "firstName": leadPassenger.firstName,
                "lastName": leadPassenger.lastName,
                "email": leadPassenger.email,
                "dob": leadPassenger.dob,
                "gender": leadPassenger.gender,
                "country": leadPassenger.country,
                "phoneCode": leadPassenger.phoneCode,
                "phone": leadPassenger.phone,
                "other_passengers": {
                    "additional_adults": AdultArray,
                    "children_details": ChildArray
                },
                "grand_total": grandTotal,
                "customer_currency": customerCurrency,
                "customer_exchange_rate": customerExchangeRate,
                "customer_amount": customerTotalAfterDiscount,
            };
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customized/packages/booking/confirm`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // 'ngrok-skip-browser-warning': 'true',
                    },
                    body: JSON.stringify(request),
                });
                const response = await res.json();
                if (response?.Success) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                    setConfirmStatus("reserve");
                     router.push(`/umrah-getaway/voucher/${response.Content.booking_reference}`);
                    // await handlePayment(response?.data);
                } else {
                    setLoaderError(response?.Description);
                    setConfirmStatus("error");
                    setTimeout(() => {
                        setLoading(false);
                        notifications.show({
                            title: response?.Title || 'Error',
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
    return (
        <div className={`umrah-getaway-checkout ${styles.checkoutForm}`}>
            <LeadDetail setFormData={setLeadPassenger} module="flight" />
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Package"
                />
            )}

            {/* Lead Person Information */}
            <div className={styles.sectionCard}>
                <h5 className={styles.formSectionTitle}>Lead Person Information</h5>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label htmlFor="leadTitle" className="form-label">Title <span className="text-danger">*</span></label>
                        <select
                            id="leadTitle"
                            value={leadPassenger.title}
                            onChange={(e) => handleLeadPassengerChange('title', e.target.value)}
                            className={`form-select ${errors.lead_title ? 'is-invalid' : ''}`}
                        >
                            <option value="">Select</option>
                            <option value="MR">Mr</option>
                            <option value="MRS">Mrs</option>
                            <option value="MISS">Miss</option>
                            <option value="MS">Ms</option>
                            <option value="DR">Dr</option>
                        </select>
                        {errors.lead_title && <div className="invalid-feedback">{errors.lead_title}</div>}
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="leadFirstName" className="form-label">First Name <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            id="leadFirstName"
                            value={leadPassenger.firstName}
                            onChange={(e) => handleLeadPassengerChange('firstName', e.target.value)}
                            className={`form-control ${errors.lead_firstName ? 'is-invalid' : ''}`}
                            placeholder="First Name"
                        />
                        {errors.lead_firstName && <div className="invalid-feedback">{errors.lead_firstName}</div>}
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="leadLastName" className="form-label">Last Name <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            id="leadLastName"
                            value={leadPassenger.lastName}
                            onChange={(e) => handleLeadPassengerChange('lastName', e.target.value)}
                            className={`form-control ${errors.lead_lastName ? 'is-invalid' : ''}`}
                            placeholder="Last Name"
                        />
                        {errors.lead_lastName && <div className="invalid-feedback">{errors.lead_lastName}</div>}
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="leadEmail" className="form-label">Email <span className="text-danger">*</span></label>
                        <input
                            type="email"
                            id="leadEmail"
                            value={leadPassenger.email}
                            onChange={(e) => handleLeadPassengerChange('email', e.target.value)}
                            className={`form-control ${errors.lead_email ? 'is-invalid' : ''}`}
                            placeholder="you@example.com"
                        />
                        {errors.lead_email && <div className="invalid-feedback">{errors.lead_email}</div>}
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="leadDob" className="form-label">Date of Birth <span className="text-danger">*</span></label>
                        <DateInput maxDate={new Date()} placeholder='Date of Birth' clearable="true" error={errors.lead_dob} value={leadPassenger.dob} onChange={(date) => handleLeadPassengerChange('dob', date)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Gender <span className="text-danger">*</span></label>
                        <div className="">
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="leadGender"
                                    id="leadMale"
                                    value="male"
                                    checked={leadPassenger.gender === 'male'}
                                    onChange={(e) => handleLeadPassengerChange('gender', e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="leadMale">Male</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="leadGender"
                                    id="leadFemale"
                                    value="female"
                                    checked={leadPassenger.gender === 'female'}
                                    onChange={(e) => handleLeadPassengerChange('gender', e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="leadFemale">Female</label>
                            </div>
                        </div>
                        {errors.lead_gender && <div className="text-danger small">{errors.lead_gender}</div>}
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="leadCountry" className="form-label">Country <span className="text-danger">*</span></label>
                        <Select
                            id="leadCountry"
                            placeholder="Select Country"
                            searchable
                            value={leadPassenger.country}
                            onChange={handleLeadCountryChange}
                            data={countryOptions}
                            limit={50}
                            error={errors.lead_country}

                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="leadPhone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                        <div className="input-group">
                            <span className="input-group-text bg-light">
                                {leadPassenger.phoneCode || "+__"}
                            </span>
                            <input
                                type="text"
                                name="leadPhone"
                                value={leadPassenger.phone}
                                onChange={(e) => handleLeadPhoneChange(e.target.value)}
                                className={`form-control ${errors.lead_phone ? "is-invalid" : ""}`}
                                placeholder="1234567890"
                                autoComplete="off"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </div>
                        {errors.lead_phone && <div className="invalid-feedback">{errors.lead_phone}</div>}
                    </div>
                    {/* <div className="col-md-6">
                        <label htmlFor="leadPassportNumber" className="form-label">Passport Number <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            id="leadPassportNumber"
                            value={leadPassenger.passportNumber}
                            onChange={(e) => handleLeadPassengerChange('passportNumber', e.target.value)}
                            className={`form-control ${errors.lead_passportNumber ? 'is-invalid' : ''}`}
                            placeholder="A1234567"
                        />
                        {errors.lead_passportNumber && <div className="invalid-feedback">{errors.lead_passportNumber}</div>}
                    </div> */}
                    {/* <div className="col-md-6">
                        <label htmlFor="leadPassportExpiry" className="form-label">Passport Expiry <span className="text-danger">*</span></label>
                        <input
                            type="date"
                            id="leadPassportExpiry"
                            value={leadPassenger.passportExpiry}
                            onChange={(e) => handleLeadPassengerChange('passportExpiry', e.target.value)}
                            className={`form-control ${errors.lead_passportExpiry ? 'is-invalid' : ''}`}
                        />
                        {errors.lead_passportExpiry && <div className="invalid-feedback">{errors.lead_passportExpiry}</div>}
                    </div> */}
                </div>
                <hr className={styles.formDivider} />
                <p className={styles.formSectionNote}>
                    This information will be used for all booking confirmations and
                    communications. Ensure that the name matches travel documents.
                </p>
            </div>

            {/* Other Passengers */}
            {passengers.length > 0 && (
                <div className={styles.sectionCard}>
                    <h5 className={styles.formSectionTitle}>Other Passengers</h5>
                    {passengers.map((passenger, index) => (
                        <div key={passenger.id} className="mb-4">
                            <div className="row">
                                <div className="col-12 d-flex justify-content-between align-items-center mb-3">
                                    <h6 className={styles.passengerTitle}>
                                        Passenger {index + 2}{' '}
                                        <span className={styles.passengerBadge}>{getPassengerTypeLabel(passenger.type)}</span>
                                    </h6>
                                </div>
                                <div className="col-12 col-md-4 mb-3">
                                    <label>Title <span className="text-danger">*</span></label>
                                    <select
                                        value={passenger.title}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'title', e.target.value)}
                                        className={`form-select ${errors[`passenger_${passenger.id}_title`] ? 'is-invalid' : ''}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="MR">Mr</option>
                                        <option value="MRS">Mrs</option>
                                        <option value="MISS">Miss</option>
                                        <option value="MS">Ms</option>
                                        <option value="DR">Dr</option>
                                        <option value="MSTR">Master</option>
                                    </select>
                                    {errors[`passenger_${passenger.id}_title`] && <div className="invalid-feedback">{errors[`passenger_${passenger.id}_title`]}</div>}
                                </div>
                                <div className="col-12 col-md-4 mb-3">
                                    <label>First Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        value={passenger.firstName}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'firstName', e.target.value)}
                                        placeholder="First Name"
                                        className={`form-control ${errors[`passenger_${passenger.id}_firstName`] ? 'is-invalid' : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_firstName`] && <div className="invalid-feedback">{errors[`passenger_${passenger.id}_firstName`]}</div>}
                                </div>
                                <div className="col-12 col-md-4 mb-3">
                                    <label>Last Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        value={passenger.lastName}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'lastName', e.target.value)}
                                        placeholder="Last Name"
                                        className={`form-control ${errors[`passenger_${passenger.id}_lastName`] ? 'is-invalid' : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_lastName`] && <div className="invalid-feedback">{errors[`passenger_${passenger.id}_lastName`]}</div>}
                                </div>
                                <div className="col-12 col-md-4 mb-3">
                                    <label>Date of Birth <span className="text-danger">*</span></label>
                                    {/* <input
                                        type="date"
                                        value={passenger.dob}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'dob', e.target.value)}
                                        className={`form-control ${errors[`passenger_${passenger.id}_dob`] ? 'is-invalid' : ''}`}
                                    /> */}
                                    <DateInput maxDate={new Date()} placeholder='Date of Birth' clearable="true" error={errors[`passenger_${passenger.id}_dob`]} value={passenger.dob} onChange={(date) => handlePassengerChange(passenger.id, 'dob', date)} />
                                    {/* {errors[`passenger_${passenger.id}_dob`] && <div className="invalid-feedback">{errors[`passenger_${passenger.id}_dob`]}</div>} */}
                                </div>
                                <div className="col-12 col-md-4 mb-3">
                                    <label>Email <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        value={passenger.email}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'email', e.target.value)}
                                        placeholder="Email"
                                        className={`form-control ${errors[`passenger_${passenger.id}_email`] ? 'is-invalid' : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_email`] && <div className="invalid-feedback">{errors[`passenger_${passenger.id}_email`]}</div>}
                                </div>
                                <div className="col-12 col-md-4 mb-3">
                                    <label>Gender <span className="text-danger">*</span></label>
                                    <div className="">
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`gender_${passenger.id}`}
                                                id={`male_${passenger.id}`}
                                                value="male"
                                                checked={passenger.gender === 'male'}
                                                onChange={(e) => handlePassengerChange(passenger.id, 'gender', e.target.value)}
                                            />
                                            <label className="form-check-label" htmlFor={`male_${passenger.id}`}>Male</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`gender_${passenger.id}`}
                                                id={`female_${passenger.id}`}
                                                value="female"
                                                checked={passenger.gender === 'female'}
                                                onChange={(e) => handlePassengerChange(passenger.id, 'gender', e.target.value)}
                                            />
                                            <label className="form-check-label" htmlFor={`female_${passenger.id}`}>Female</label>
                                        </div>
                                    </div>
                                    {errors[`passenger_${passenger.id}_gender`] && <div className="text-danger small">{errors[`passenger_${passenger.id}_gender`]}</div>}
                                </div>
                                <div className="col-12 col-md-6 mb-3">
                                    <label>Country <span className="text-danger">*</span></label>
                                    <Select
                                        placeholder="Select Country"
                                        searchable
                                        value={passenger.country}
                                        onChange={(value) => handlePassengerCountryChange(passenger.id, value)}
                                        data={countryOptions}
                                        limit={50}
                                        error={errors[`passenger_${passenger.id}_country`]}
                                    />
                                </div>
                                <div className="col-12 col-md-6 mb-3">
                                    <label>Phone Number <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light">
                                            {passenger.phoneCode || "+__"}
                                        </span>
                                        <input
                                            type="text"
                                            name="leadPhone"
                                            value={passenger.phone}
                                            onChange={(e) => handlePassengerChange(passenger.id, 'phone', e.target.value)}
                                            className={`form-control ${errors[`passenger_${passenger.id}_phone`] ? "is-invalid" : ""}`}
                                            placeholder="1234567890"
                                            autoComplete="off"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                        />
                                    </div>
                                    {errors[`passenger_${passenger.id}_phone`] && <div className="invalid-feedback">{errors[`passenger_${passenger.id}_phone`]}</div>}
                                </div>
                                {/* <div className="col-12 col-md-4 mb-3">
                                    <label>Passport Number <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        value={passenger.passportNumber}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'passportNumber', e.target.value)}
                                        placeholder="Passport Number"
                                        className={`form-control ${errors[`passenger_${passenger.id}_passportNumber`] ? 'is-invalid' : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_passportNumber`] && <div className="invalid-feedback">{errors[`passenger_${passenger.id}_passportNumber`]}</div>}
                                </div> */}
                                {/* <div className="col-12 col-md-4 mb-3">
                                    <label>Passport Expiry <span className="text-danger">*</span></label>
                                    <input
                                        type="date"
                                        value={passenger.passportExpiry}
                                        onChange={(e) => handlePassengerChange(passenger.id, 'passportExpiry', e.target.value)}
                                        className={`form-control ${errors[`passenger_${passenger.id}_passportExpiry`] ? 'is-invalid' : ''}`}
                                    />
                                    {errors[`passenger_${passenger.id}_passportExpiry`] && <div className="invalid-feedback">{errors[`passenger_${passenger.id}_passportExpiry`]}</div>}
                                </div> */}
                            </div>
                            {index < passengers.length - 1 && <hr />}
                        </div>
                    ))}
                </div>
            )}
            <div className={styles.importantInfoBox}>
                <h4 className={styles.importantInfoTitle}>Important Information</h4>
                <ul className={styles.importantInfoList}>
                    <li>Please ensure all travelers carry valid passports and visas (if required) throughout the journey.</li>
                    <li>Hotel check-in and check-out times are subject to the hotel’s policy. Early check-in or late check-out is not guaranteed.</li>
                    <li>Flight schedules are subject to airline confirmation and may change. Please reconfirm timings 24 hours before departure.</li>
                    <li>Baggage allowance and onboard services depend on airline rules and selected fare.</li>
                    <li>Airport transfers and other included services operate as per the confirmed itinerary only.</li>
                    <li>Any additional services not mentioned in the package itinerary will be charged separately.</li>
                    <li>This booking is confirmed electronically; no physical documents are required except valid travel IDs.</li>
                </ul>
            </div>
            <div className="form-check mt-4">
                {/* <input
                    className={`form-check-input ${errors.terms ? 'is-invalid' : ''}`}
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
                /> */}
                {/* <label className="form-check-label" htmlFor="terms">
                    I agree to the <Link href="/terms-and-conditions" target='_blank'>terms and conditions</Link>. <span className="text-danger">*</span>
                </label> */}
                {errors.terms && <div className="text-danger small mt-1">{errors.terms}</div>}
            </div>
            {/* <div className="d-grid mt-4">
                <button onClick={handleSubmit} type="submit" className="btn btn-success">Confirm Booking</button>
            </div> */}
        </div>
    )
}
