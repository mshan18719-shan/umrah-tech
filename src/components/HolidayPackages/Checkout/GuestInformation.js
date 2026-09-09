'use client'
import React, { useState, useEffect } from 'react'
import { countryListLocal } from '@/util/CountryList';
import { Select } from '@mantine/core';
import Link from 'next/link';
import { useCurrency } from "@/util/currency";
import { DateInput } from '@mantine/dates';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useRouter } from 'next/navigation';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import { isValidPhoneNumber } from 'libphonenumber-js';
export default function GuestInformation({ packageConfig, Selectedcurrency, calculatedTotal, selectedData, packagePricing }) {
    const { currency, rates } = useCurrency();
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaderError, setLoaderError] = useState("");
    const [confirmStatus, setConfirmStatus] = useState("pending");
    const router = useRouter();
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
        if (packageConfig?.searchData?.totalGuests) {
            const passengerList = [];
            let passengerId = 1;
            const { adults, children } = packageConfig?.searchData?.totalGuests;
            // Count passenger types
            const counts = { adult: adults || 0, child: children || 0, infant: 0 };

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
                    });
                }
            }

            setPassengers(passengerList);
        }
    }, [packageConfig]);

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
            const passengerFields = ['title', 'firstName', 'lastName', 'gender', 'dob'];
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
        if (!validateForm()) {
            alert('validation error')
            return;
        }
        setLoaderError("");
        setLoading(true);
        setConfirmStatus("pending");
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConfirmStatus("validate");
        const otherAdults = passengers.filter(item => item.type === 'adult');
        const otherChilds = passengers.filter(item => item.type === 'child');
        const services = [];
        if (packageConfig?.selectedServices?.hotel) services.push("stay");
        if (packageConfig?.selectedServices?.flight) services.push("flight");
        if (packageConfig?.selectedServices?.transfer) services.push("car");
        var Hotelprice = 0;
        var hotelCurrency = "";
        var Flightprice = 0;
        var flightCurrency = "";
        var Transferprice = 0;
        var transferCurrency = "";

        if (packagePricing?.hotelPrice) {
            const NewPrice = ConvertPrice(packagePricing.hotelPrice, packagePricing.hotelCurrency, currency, rates);
            Hotelprice = parseFloat(NewPrice.newprice);
            hotelCurrency = NewPrice.newcurrency;
        }
        if (packagePricing?.flightPrice) {
            const NewPrice = ConvertPrice(packagePricing.flightPrice, packagePricing.flightCurrency, currency, rates);
            Flightprice = parseFloat(NewPrice.newprice);
            flightCurrency = NewPrice.newcurrency;
        }
        if (packagePricing?.transferPrice) {
            const NewPrice = ConvertPrice(packagePricing.transferPrice, packagePricing.transferCurrency, currency, rates);
            Transferprice = parseFloat(NewPrice.newprice);
            transferCurrency = NewPrice.newcurrency;
        }
        const newroomlist = selectedData?.hotel?.hotelData?.rooms
            ?.filter(item =>
                selectedData?.hotel?.selectedRoom?.some(room => room?.roomId === item.id)
            )
            ?.flatMap(item =>
                item?.rates
                    ?.filter(rate =>
                        selectedData?.hotel?.selectedRoom?.some(
                            room => room?.ratekey === rate.rate_key
                        )
                    )
                    ?.map(rateItem => ({
                        rateKey: rateItem.rate_key,
                        quantity:
                            selectedData?.hotel?.selectedRoom?.find(
                                room => room?.ratekey === rateItem.rate_key
                            )?.qty || 1,
                        price: rateItem.price,
                        currency: rateItem.currency,
                        displayPrice: rateItem.price,
                        displayCurrency: rateItem.currency,
                        roomType: item.name,
                        boardName: rateItem.board_name,
                        adults: rateItem?.adults,
                        children: rateItem?.children,
                    }))
            );
        const request = {
            "package_context": {
                "package_id": selectedData?.packageInfo?.package_id,
                "services": services,
                "priceBreakdown": {
                    "hotel": hotelCurrency,
                    "hotelPrice": Hotelprice,
                    "flight": flightCurrency,
                    "flightPrice": Flightprice,
                    "transfer": transferCurrency,
                    "transferPrice": Transferprice
                },
                "hotel": {
                    "id": selectedData?.hotel?.hotelData?.hotel_code,
                    "name": selectedData?.hotel?.hotelData?.hotel_name,
                    "location": selectedData?.hotel?.hotelData?.city,
                    "checkIn": selectedData?.hotel?.hotelData?.checkIn,
                    "provider": selectedData?.hotel?.hotelData?.provider,
                    "checkOut": selectedData?.hotel?.hotelData?.checkOut,
                    "currency": hotelCurrency,
                    // "rooms": packageConfig?.searchData?.rooms || [],
                },
                "flight": {
                    "available": true,
                    "data": {
                        "id": selectedData?.flight?.id,
                        "provider": selectedData?.flight?.provider,
                        "fareSourceCode": selectedData?.flight?.fareSourceCode,
                        "fare_type": selectedData?.flight?.fare_type,
                        "refundable": selectedData?.flight?.refundable,
                        "trip_type": selectedData?.flight?.trip_type,
                        "pricing": selectedData?.flight?.pricing,
                        "passenger_pricing": selectedData?.flight?.passenger_pricing,
                        "segments": selectedData?.flight?.segments,
                        "price": selectedData?.flight?.price,
                        "is_cheapest": selectedData?.flight?.is_cheapest
                    }
                },
                "transfer": {
                    "available": true,
                    "data": {
                        "id": selectedData?.transfer?.id,
                        "trip_type": selectedData?.transfer?.trip_type,
                        "vehicle": selectedData?.transfer?.vehicle_details?.name,
                        "vehicle_details": selectedData?.transfer?.vehicle_details,
                        "fare": selectedData?.transfer?.fare,
                        "currency": selectedData?.transfer?.currency,
                        "provider": selectedData?.transfer?.provider,
                        'locations': selectedData?.transfer?.locations
                    }
                },
                "searchData": {
                    "leavingFrom": {
                        "city": packageConfig?.selectedServices.flight ? packageConfig?.searchData?.flight?.from : packageConfig?.searchData?.hotel?.location,
                        "countryCode": packageConfig?.selectedServices.flight ? packageConfig?.searchData?.flight?.fromLocation?.countryCode : packageConfig?.searchData?.hotel?.countryCode,
                        "airportCode": packageConfig?.searchData?.flight?.from
                    },
                    "goingTo": {
                        "city": packageConfig?.selectedServices.flight ? packageConfig?.searchData?.flight?.to : packageConfig?.searchData?.hotel?.location,
                        "countryCode": packageConfig?.selectedServices.flight ? packageConfig?.searchData?.flight?.toLocation?.countryCode : packageConfig?.searchData?.hotel?.countryCode,
                        "airportCode": packageConfig?.searchData?.flight?.to
                    },
                    "dates": {
                        "checkIn": packageConfig?.searchData?.dates?.checkIn,
                        "checkOut": packageConfig?.searchData?.dates?.checkOut
                    },
                    "travelers": {
                        "rooms": packageConfig?.searchData?.rooms || [],
                    },
                    "economyClass": packageConfig?.searchData?.flight?.cabinClassName,
                    "currency": "GBP"
                },
                "selectedHotelRooms": newroomlist || [],
                "isFromPackageFlow": true,
                "selectedCurrency": Selectedcurrency
            },
            "lead_person": {
                "title": leadPassenger.title,
                "firstName": leadPassenger.firstName,
                "lastName": leadPassenger.lastName,
                "email": leadPassenger.email,
                "dob": leadPassenger.dob,
                "gender": leadPassenger.gender,
                "country": leadPassenger.country,
                "phoneCode": leadPassenger.phoneCode,
                "phone": leadPassenger.phone
            },
            "other_passengers": {
                "additional_adults": otherAdults,
                "children_details": otherChilds
            },

            "customer_amount": calculatedTotal,
            "customer_currency": Selectedcurrency,
            "customer_exchange_rate": 1,
            "type": "confirm",
            "booking_type": 1,
            "contact_id": null,
            "markup": null
        }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/holiday-packages/booking/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            const data = await response.json();
            if (data?.Success) {
                setConfirmStatus("reserve");
                setTimeout(() => {
                    setLoading(false);
                    router.push(`/holiday-packages/voucher/${data?.Content?.booking_reference}`);
                }, 1000);
            } else {
                setConfirmStatus('error');
                setLoaderError(data?.error?.message || "Booking failed. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setShowLoader(false);
                    notifications.show({
                        title: 'Error',
                        message: data?.error?.message || "Booking failed. Please try again.",
                        autoClose: 3500,
                        color: 'red'
                    })
                }, 1000);
            }
        } catch (error) {
            setConfirmStatus('error');
            setLoaderError('Something went wrong. Please try again.');
            setTimeout(() => setLoading(false), 1000);
        } finally {
            setLoading(false);
        }
    };

    const handleLoaderComplete = () => {
    };
   
    return (
        <div>
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
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
                <strong>Secure your booking!</strong> Just share a few quick details and your holiday package will be ready in no time.
            </div>

            {/* Lead Passenger Information */}
            <div style={{
                borderLeft: '4px solid rgb(0 76 76)',
                borderRadius: '8px',
                background: '#fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                marginBottom: '16px',
                overflow: 'hidden',
            }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'rgb(0 76 76)', color: '#fff',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 800,
                    }}>1</span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Lead Passenger</span>
                    <span style={{
                        marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                        background: '#fef3c7', color: '#92400e',
                        padding: '2px 9px', borderRadius: '50px', letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>Primary</span>
                </div>
                <div className="row m-3 g-3">
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
                        {errors.lead_phone && <div className="text-danger small">{errors.lead_phone}</div>}
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
                <hr />
                <p className="text-muted small m-3">
                    This information will be used for all booking confirmations and
                    communications. Ensure that the name matches travel documents.
                </p>
            </div>

            {/* ── Other Passengers ── */}
            {passengers.length > 0 && (
                <div style={{
                    borderLeft: '4px solid rgb(0 76 76)',
                    borderRadius: '8px',
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    marginBottom: '16px',
                    overflow: 'hidden',
                }}>
                    <div style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: 'rgb(0 76 76)', color: '#fff',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.72rem', fontWeight: 800,
                        }}>2</span>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Co-Travellers</span>
                        <span style={{
                            marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                            background: '#d1fae5', color: '#065f46',
                            padding: '2px 9px', borderRadius: '50px', letterSpacing: '0.05em', textTransform: 'uppercase',
                        }}>{passengers.length} {passengers.length === 1 ? 'passenger' : 'passengers'}</span>
                    </div>

                    {passengers.map((passenger, index) => (
                        <div key={passenger.id} className="mb-4 m-3">
                            <div className="row">
                                <div className="col-12 d-flex justify-content-between align-items-center mb-3">
                                    <h6>Passenger {index + 2} <span style={{ fontSize: '12px' }} className="small bg-secondary-subtle rounded px-2 py-1">{getPassengerTypeLabel(passenger.type)}</span></h6>
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
                                    <DateInput maxDate={new Date()} placeholder='Date of Birth' clearable="true" error={errors[`passenger_${passenger.id}_dob`]} value={passenger.dob} onChange={(date) => handlePassengerChange(passenger.id, 'dob', date)} />
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
                            </div>
                            {index < passengers.length - 1 && <hr />}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Flight Important Info ── */}
            {packageConfig?.selectedServices?.flight && (
                <div style={{
                    borderLeft: '4px solid #f59e0b',
                    borderRadius: '8px',
                    background: '#fffbeb',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    marginBottom: '16px',
                    padding: '14px 18px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#d97706"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flight Information</span>
                    </div>
                    <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                        {[
                            'Arrive at the airport at least 3 hours before international flights.',
                            'Valid passport and visa (if required) must be presented at check-in.',
                            'Check-in closes 60 minutes before departure.',
                            'Baggage allowance is subject to airline terms and conditions.',
                            'Flight timings may change — confirm with the airline 24 hours before departure.',
                        ].map((item, i) => (
                            <li key={i} style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: '1.7' }}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="form-check mt-4">
                <input
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
                />
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
