"use client";

import React, { useState, useEffect, useRef } from "react";
import { Select } from "@mantine/core";
import { countryListLocal } from "@/util/CountryList";
import PackageBookingLoader from "@/components/Loader/PackageBookingLoader";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { TiDeleteOutline } from "react-icons/ti";
import { BiCreditCard, BiLock } from "react-icons/bi";
import { BsBank, BsCheckCircleFill } from "react-icons/bs";
import { MdVerified } from "react-icons/md";
import { IoPeopleOutline, IoPersonOutline, IoCardOutline, IoPersonAddOutline } from "react-icons/io5";
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import Link from "next/link";
import moment from "moment";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";

const NAME_MAX = 35;
const EMAIL_MAX = 200;

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

export default function CheckoutForm({
    data,
    currency,
    rates,
    totalGuests = 0,
    guestLabel = '',
    onRegisterSubmit,
    onLoadingChange,
}) {
    const [showLoader, setShowLoader] = useState(false);
    const [loaderError, setLoaderError] = useState("");
    const [currencyKey, setCurrencyKey] = useState("");
    const [otherGuestDetail, setOtherGuestDetail] = useState([]);
    const [otherGuestError, setOtherGuestError] = useState([]);
    const [roomOnRequest, setRoomOnRequest] = useState(false);
    const [confirmStatus, setConfirmStatus] = useState("pending");
    const [searchData, setSearchData] = useState({});
    const [childrenAges, setChildrenAges] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState("card");
    const router = useRouter();
    const handleCheckoutRef = useRef(null);
    useEffect(() => {
        if (!data?.rooms) return;
        const totals = data?.rooms ? data?.rooms.reduce(
            (acc, room) => {
                room.rates.forEach(rate => {
                    acc.adults += rate.adults || 0;
                    acc.children += rate.children || 0;
                });
                return acc;
            },
            { adults: 0, children: 0 }
        ) : [];
        const adjustedTotals = {
            ...totals,
            adults: Math.max(totals.adults - 1, 0),
        };
        setSearchData(adjustedTotals);
        const isAnyRoomOnRequest = data.rooms.some(room =>
            room.rates.some(rate => rate.on_request === true)
        );
        setRoomOnRequest(isAnyRoomOnRequest);
    }, [data]);

    useEffect(() => {
        try {
            let rooms = [];
            if (Array.isArray(data?.search_rooms) && data.search_rooms.length > 0) {
                rooms = data.search_rooms;
            } else if (Array.isArray(data?.selected_occupancy) && data.selected_occupancy.length > 0) {
                rooms = data.selected_occupancy;
            } else {
                const stored = localStorage.getItem('searchRoomSelection');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) rooms = parsed;
                }
            }

            const ages = rooms.flatMap((room) => {
                if (!Array.isArray(room?.children)) return [];
                return room.children
                    .map((c) => Number(c?.age ?? c))
                    .filter((age) => Number.isFinite(age) && age > 0);
            });
            setChildrenAges(ages);
        } catch {
            setChildrenAges([]);
        }
    }, [data?.search_rooms, data?.selected_occupancy]);

    useEffect(() => {
        const callCurrencyAPI = async () => {
            if (!data?.hotel_code) return;
            var APiCurrency = currency;
            if (Object.keys(rates).length === 1) {
                APiCurrency = data?.currency;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/checkout/currency`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model_id: data?.hotel_code,
                        type: "hotel",
                        display_currency: APiCurrency,
                        model_currency: data?.currency,
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
    }, [currency, data]);
    // ---- Create country list array ----
    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }));

    // ---- Form state ----
    const [formData, setFormData] = useState({
        title: "",
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        phoneCode: "",
        phone: "",
        dateOfBirth: "",
        passportNumber: "",
        passportExpiry: "",
        requests: "",
        cardNumber: "",
        expiry: "",
        cvv: "",
        terms: false,
    });

    useEffect(() => {
        if (onRegisterSubmit) {
            onRegisterSubmit(() => handleCheckoutRef.current?.());
        }
    }, [onRegisterSubmit]);

    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(showLoader);
        }
    }, [showLoader, onLoadingChange]);

    // ---- Validation errors ----
    const [errors, setErrors] = useState({});

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
        const nextForm = {
            ...formData,
            [name]: nextValue,
        };
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
        // if (!formData.cardNumber) newErrors.cardNumber = "Card number is required.";
        // if (!formData.expiry) newErrors.expiry = "Expiry date is required.";
        // if (!formData.cvv) newErrors.cvv = "CVV is required.";
        if (!formData.terms) newErrors.terms = "You must agree to terms.";

        setOtherGuestError(otherGuestErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 && otherGuestErrors.every(err => Object.keys(err).length === 0);
    };
    // ---- Submit handler ----
    const handleCheckout = async () => {
        if (!validateForm()) return;
        setLoaderError("");
        setConfirmStatus("pending");
        setShowLoader(true);

        // Wait for first two steps (2 seconds each)
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConfirmStatus("validate");

        const otherAdults = otherGuestDetail.filter(item => item.type === 'AD');
        const otherChilds = otherGuestDetail
            .filter(item => item.type === 'CH')
            .map((item, index) => {
                const ageFromGuest = Number(item.age);
                const ageFromSearch = Number(childrenAges[index]);
                const age = Number.isFinite(ageFromGuest) && ageFromGuest > 0
                    ? ageFromGuest
                    : (Number.isFinite(ageFromSearch) && ageFromSearch > 0 ? ageFromSearch : undefined);
                return age != null
                    ? { firstName: item.firstName, lastName: item.lastName, type: item.type, age }
                    : { firstName: item.firstName, lastName: item.lastName, type: item.type };
            });
        let selectedPaymentMethod = 'stripe';
        if (paymentMethod === 'bank') {
            selectedPaymentMethod = 'bank_transfer';
        }
        // Calculate currency conversion
        const hotelCurrency = data?.currency;
        const grandTotal = Number(data?.total_net);

        let customerCurrency = currency;
        let customerExchangeRate = 1;
        let customerTotalAfterDiscount = grandTotal;
        if (currency !== hotelCurrency && rates[hotelCurrency] && rates[currency]) {
            const conversion = ConvertPrice(data?.total_net, data?.currency, currency, rates);
            customerCurrency = conversion.newcurrency;
            customerTotalAfterDiscount = parseFloat(conversion.newprice);

            // Calculate exchange rate
            customerExchangeRate = (rates[currency] / rates[hotelCurrency]);
        } else {
            customerCurrency = hotelCurrency;
            customerExchangeRate = 1;
            customerTotalAfterDiscount = grandTotal;
        }
        // Now make the API call
        const domain = window.location.origin;
        const checkoutUrl = window.location;
        const request = {
            "provider": data?.provider,
            "currency_uuid": currencyKey,
            "holder_title": formData?.title,
            "holder_email": formData?.email,
            "checkIn": data?.check_in,
            "checkOut": data?.check_out,
            "holder_phone": formData?.phoneCode + formData?.phone,
            "holder_country": formData?.country,
            "remark": formData?.requests,
            "otherAdults": otherAdults,
            "otherChilds": otherChilds,
            "payment_method": selectedPaymentMethod,
            "holder": {
                "name": formData.firstName,
                "surname": formData.lastName,
            },
            "rooms": data.rooms.map(item => ({
                code: item.code,
                name: item.name,
                status: item.status,
                rates: item.rates.map(rate => ({
                    rate_key: rate.rate_key,
                    rate_type: rate.rate_type,
                    prebook_id: item?.metadata?.prebook_id || '',
                    rate_id: item?.metadata?.rate_id || '',
                    adults: rate.adults,
                    children: rate.children,
                    rooms: rate.rooms,
                })),
            })),
            "clientReference": `ref_${Date.now()}`,
            "currency": data?.currency,
            "booking_amount": data?.total_net,
            "converted_price": customerTotalAfterDiscount,
            "exchange_rate": customerExchangeRate,
            "converted_currency": customerCurrency,
            "success_url": `${domain}/hotels/voucher`,
            "cancel_url": `${checkoutUrl}`,

            "check_rates_request": {
                "data": data,
            }
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/create-booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true', 
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            if (response?.success) {
                setConfirmStatus("reserve");
                if (roomOnRequest || selectedPaymentMethod === 'bank_transfer') {
                    setShowLoader(false);
                    router.push(`/hotels/voucher/${response?.data?.invoice_number}`);
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 800));
                setConfirmStatus("payment");
                setTimeout(() => {
                    setShowLoader(false);
                    router.push(`${response?.data?.checkout_url}`);
                }, 800);
            } else {
                setLoaderError(response?.error?.message || "Booking failed. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setShowLoader(false);
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
            setTimeout(() => setShowLoader(false), 1000);
        }
    };
    const handleGuestAdd = () => {
        const totalAllowed = searchData?.adults + searchData?.children;
        const currentAdults = otherGuestDetail.filter(g => g.type === 'AD').length;
        const currentChildren = otherGuestDetail.filter(g => g.type === 'CH').length;
        if (otherGuestDetail.length >= totalAllowed) {
            return;
        }
        setOtherGuestError([])
        if (currentAdults < searchData?.adults) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', type: 'AD' }]);
        } else if (currentChildren < searchData?.children) {
            const nextAge = Number(childrenAges[currentChildren]);
            setOtherGuestDetail([
                ...otherGuestDetail,
                {
                    firstName: '',
                    lastName: '',
                    type: 'CH',
                    ...(Number.isFinite(nextAge) && nextAge > 0 ? { age: nextAge } : {}),
                },
            ]);
        }

    };
    const handleGuestRemove = (index) => {
        const updatedGuests = otherGuestDetail.filter((_, i) => i !== index);
        setOtherGuestDetail(updatedGuests);
        syncLiveNameValidation(formData, updatedGuests);
    };
    const handleGuestChange = (e, index) => {
        const { name, value } = e.target;
        const updatedGuests = [...otherGuestDetail];
        updatedGuests[index] = { ...updatedGuests[index], [name]: value };
        setOtherGuestDetail(updatedGuests);

        if (name === 'firstName' || name === 'lastName') {
            syncLiveNameValidation(formData, updatedGuests);
            return;
        }

        const updatedErrors = [...otherGuestError];
        if (updatedErrors[index]?.[name]) {
            updatedErrors[index] = { ...updatedErrors[index], [name]: "" };
            setOtherGuestError(updatedErrors);
        }
    };
    const handleLoaderComplete = () => {

    }

    handleCheckoutRef.current = handleCheckout;

    return (
        <div>
            <LeadDetail setFormData={setFormData} />
            {showLoader && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={showLoader}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Room"
                />
            )}

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
                            passenger{totalGuests !== 1 ? 's' : ''}
                            {guestLabel ? ` (${guestLabel})` : ''}
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
                        <p>Primary contact for booking confirmations</p>
                    </div>
                </div>

                <div className="row mb-3 g-3">
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

                    <div className="col-md-6">
                        <label className="form-label">Email Address*</label>
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

                    <div className="col-md-6">
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
                                placeholder="7123456789"
                                autoComplete="off"
                            />
                        </div>
                        {errors.phone && (
                            <div className="invalid-feedback d-block">{errors.phone}</div>
                        )}
                    </div>

                    {/* <div className="col-md-6">
                        <label className="form-label">Date of Birth</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div> */}

                    <div className="col-md-6">
                        <label className="form-label">Nationality*</label>
                        <Select
                            placeholder="Select nationality"
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

                    {/* <div className="col-md-6">
                        <label className="form-label">Passport Number</label>
                        <input
                            type="text"
                            name="passportNumber"
                            value={formData.passportNumber}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="e.g. AB1234567"
                            autoComplete="off"
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Passport Expiry</label>
                        <input
                            type="date"
                            name="passportExpiry"
                            value={formData.passportExpiry}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div> */}
                </div>

                <p className="checkout-form-note">
                    This information will be used for all booking confirmations and
                    communications. Ensure that the name matches travel documents.
                </p>
            </div>

            <div className="checkout-form-card">
                <div className="checkout-form-card-header">
                    <div className="checkout-form-card-icon">
                        <IoPersonAddOutline />
                    </div>
                    <div>
                        <h5>Additional Guests</h5>
                        <p>Optional guest details for shared rooms</p>
                    </div>
                </div>

                <button type="button" onClick={handleGuestAdd} className="btn-add-guest">
                    + Add New Guest
                </button>

                {otherGuestDetail.map((item, index) => (
                    <div key={index} className="guest-card">
                        <div className="guest-card-header">
                            <h6>
                                Guest {index + 2}{' '}
                                {item.type === 'CH' && <span className="guest-type-badge">Child</span>}
                            </h6>
                            <TiDeleteOutline
                                onClick={() => handleGuestRemove(index)}
                                className="text-danger cursor-pointer"
                                size={20}
                            />
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    onChange={(e) => handleGuestChange(e, index)}
                                    value={item.firstName}
                                    placeholder="First Name"
                                    maxLength={35}
                                    className={`form-control ${otherGuestError[index]?.firstName ? "is-invalid" : ""}`}
                                />
                                {otherGuestError[index]?.firstName && (
                                    <div className="invalid-feedback">{otherGuestError[index]?.firstName}</div>
                                )}
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    onChange={(e) => handleGuestChange(e, index)}
                                    value={item.lastName}
                                    placeholder="Last Name"
                                    maxLength={35}
                                    className={`form-control ${otherGuestError[index]?.lastName ? "is-invalid" : ""}`}
                                />
                                {otherGuestError[index]?.lastName && (
                                    <div className="invalid-feedback">{otherGuestError[index]?.lastName}</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="checkout-form-card">
                <div className="checkout-form-card-header">
                    <div>
                        <h5>Special requests</h5>
                        <p>Optional notes for the hotel (cannot be guaranteed)</p>
                    </div>
                </div>
                <textarea
                    className="form-control w-100"
                    rows={4}
                    name="requests"
                    value={formData.requests}
                    onChange={handleChange}
                    placeholder="Please write your requests in English (optional)"
                />
            </div>

            <div className="checkout-form-card">
                <div className="checkout-form-card-header">
                    <div className="checkout-form-card-icon">
                        <IoCardOutline />
                    </div>
                    <div>
                        <h5>Payment Method</h5>
                        <p>Select your preferred payment method</p>
                    </div>
                </div>

                {roomOnRequest ? (
                    <div className="checkout-onrequest-note">
                        An On Request room is not instantly confirmed and requires approval from the hotel before the booking can be finalized. Payment cannot be processed during checkout until confirmation.
                    </div>
                ) : (
                    <div className="checkout-payment-tabs">
                        <button
                            type="button"
                            className={`checkout-payment-tab ${paymentMethod === "card" ? "is-active" : ""}`}
                            onClick={() => setPaymentMethod("card")}
                        >
                            <BiCreditCard size={18} />
                            Debit / Credit Card
                        </button>
                        <button
                            type="button"
                            className={`checkout-payment-tab ${paymentMethod === "bank" ? "is-active" : ""}`}
                            onClick={() => setPaymentMethod("bank")}
                        >
                            <BsBank size={16} />
                            Bank Transfer
                        </button>
                    </div>
                )}

                {paymentMethod === "card" && !roomOnRequest && (
                    <div className="htlpay-content mt-3">
                        <div className="htlpay-stripe-bar">
                            <div className="htlpay-stripe-left">
                                <BiLock size={16} />
                                Secured &amp; powered by <strong style={{ color: '#5b21b6' }}>Stripe</strong>
                            </div>
                            <div className="htlpay-trust-badges">
                                <span className="htlpay-badge"><BsCheckCircleFill size={11} /> 256-bit SSL</span>
                                <span className="htlpay-badge"><BsCheckCircleFill size={11} /> PCI DSS Compliant</span>
                                <span className="htlpay-badge"><BsCheckCircleFill size={11} /> 3D Secure</span>
                            </div>
                        </div>
                    </div>
                )}

                {paymentMethod === "bank" && !roomOnRequest && (
                    <div className="htlpay-content mt-3">
                        <div className="htlpay-bank-card">
                            <div className="htlpay-bank-header">
                                <BsBank size={18} color="#0369a1" />
                                <h6>Our Bank Account Details</h6>
                            </div>
                            <div className="htlpay-bank-rows">
                                <div className="htlpay-bank-row">
                                    <span className="htlpay-bank-key">Account Title</span>
                                    <span className="htlpay-bank-val">UmrahTech Ltd</span>
                                </div>
                                <div className="htlpay-bank-row">
                                    <span className="htlpay-bank-key">Account Number</span>
                                    <span className="htlpay-bank-val">58516868</span>
                                </div>
                                <div className="htlpay-bank-row">
                                    <span className="htlpay-bank-key">Sort Code</span>
                                    <span className="htlpay-bank-val">309950</span>
                                </div>
                            </div>
                        </div>
                        <div className="htlpay-bank-note">
                            <MdVerified size={15} />
                            <span>
                                After completing the bank transfer, please send the payment receipt to
                                {" "}<strong>info@umrahTech.net</strong> with your booking reference.
                                Your booking will be confirmed within <strong>24 hours</strong> of payment verification.
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="checkout-terms-row">
                <input
                    className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
                    type="checkbox"
                    id="hotel-terms"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="hotel-terms">
                    I agree to the <Link href="/terms-and-conditions" target="_blank"><strong>Terms &amp; Conditions</strong></Link> and <Link href="/privacy-policy" target="_blank"><strong>Privacy Policy</strong></Link>.
                </label>
                {errors.terms && (
                    <div className="text-danger small mt-1 w-100">{errors.terms}</div>
                )}
            </div>

            <button
                onClick={handleCheckout}
                type="button"
                className="btn-confirm-booking"
                disabled={showLoader}
            >
                {showLoader ? 'Processing...' : 'Confirm Booking'}
            </button>
        </div>
    );
}

