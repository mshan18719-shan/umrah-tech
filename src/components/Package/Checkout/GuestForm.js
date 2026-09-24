'use client';

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { countryListLocal } from '@/util/CountryList';
import { Select } from '@mantine/core';
import { TiDeleteOutline } from 'react-icons/ti';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useCurrency } from '@/util/currency';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import Autocomplete from 'react-google-autocomplete';
import { FaUsers, FaCreditCard, FaUniversity } from 'react-icons/fa';
import styles from './GuestForm.module.css';

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

const GuestForm = forwardRef(function GuestForm(
  {
    packageDetail,
    servicesTotal,
    selectedServices,
    expandedRooms,
    withoutBedTotal,
    passengerCount = 0,
    hideSubmit = false,
  },
  ref
) {
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const { currency, rates } = useCurrency();
  const [totalPersons, setTotalPersons] = useState({
    adults: 0,
    children: 0,
    infants: 0,
  });
  const [otherGuestDetail, setOtherGuestDetail] = useState([]);
  const [otherGuestError, setOtherGuestError] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaderError, setLoaderError] = useState('');
  const [confirmStatus, setConfirmStatus] = useState('pending');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    phoneCode: '',
    phone: '',
    requests: '',
    gender: 'male',
    terms: false,
  });

  useEffect(() => {
    const totals = packageDetail?.selected_rooms
      ? packageDetail.selected_rooms.reduce(
        (acc, item) => {
          acc.adults += Number(item.adults);
          acc.children += Number(item.children);
          acc.infants += Number(item.infants);
          return acc;
        },
        { adults: 0, children: 0, infants: 0 }
      )
      : { adults: 0, children: 0, infants: 0 };
    setTotalPersons({
      ...totals,
      adults: Math.max(totals.adults - 1, 0),
    });
  }, [packageDetail]);

  const countryOptions = countryListLocal.item.map((item) => ({
    label: item.name.common,
    value: item.name.common,
    code:
      item.idd?.root && item.idd?.suffixes?.length
        ? item.idd.root + item.idd.suffixes[0]
        : item.idd?.root,
  }));

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
    const nextValue = type === 'checkbox' ? checked : value;

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

  const handleCountryChange = (value) => {
    const selected = countryOptions.find((c) => c.value === value);
    setFormData({
      ...formData,
      country: value,
      phoneCode: selected?.code || formData.phoneCode,
    });

    if (errors.country) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.country;
        return updated;
      });
    }
  };

  const handlePlaceSelected = (place) => {
    if (!place || !place.formatted_address) return;
    const address = place.formatted_address;
    const countryComponent = place.address_components?.find((component) =>
      component.types.includes('country')
    );

    if (countryComponent) {
      const countryName = countryComponent.long_name;
      const matchedCountry = countryOptions.find(
        (c) => c.value === countryName || c.label === countryName
      );

      if (matchedCountry) {
        setFormData({
          ...formData,
          address,
          country: matchedCountry.value,
          phoneCode: matchedCountry.code || '',
        });
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.address;
          delete updated.country;
          return updated;
        });
      } else {
        setFormData({ ...formData, address });
        if (errors.address) {
          setErrors((prev) => {
            const updated = { ...prev };
            delete updated.address;
            return updated;
          });
        }
      }
    } else {
      setFormData({ ...formData, address });
      if (errors.address) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.address;
          return updated;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.title) newErrors.title = 'Please select a title.';

    const { leadErrors, guestErrors: otherGuestErrors } = computeNameErrors(
      formData.firstName,
      formData.lastName,
      otherGuestDetail,
      { requireFilled: true }
    );
    Object.assign(newErrors, leadErrors);

    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (String(formData.email).length > EMAIL_MAX) {
      newErrors.email = `Email must be ${EMAIL_MAX} characters or fewer.`;
    } else if (emailRegex.test(formData.email) === false) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.phone) newErrors.phone = 'Phone number is required.';
    if (formData.phone) {
      const phoneDigits = String(formData.phone).replace(/\D/g, '');
      if (phoneDigits.length > 15 || phoneDigits.length < 6) {
        newErrors.phone = 'Phone number must be between 6 and 15 digits.';
      }
    }
    if (!formData.country) newErrors.country = 'Please select a country.';
    if (!formData.address) newErrors.address = 'Address is required.';
    if (!formData.terms) newErrors.terms = 'You must agree to terms.';

    setOtherGuestError(otherGuestErrors);
    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0 &&
      otherGuestErrors.every((err) => Object.keys(err).length === 0)
    );
  };

  const handleGuestAdd = () => {
    const totalAllowed =
      totalPersons?.adults + totalPersons?.children + totalPersons?.infants;
    const currentAdults = otherGuestDetail.filter((g) => g.type === 'AD').length;
    const currentChildren = otherGuestDetail.filter((g) => g.type === 'CH').length;
    const currentInfant = otherGuestDetail.filter((g) => g.type === 'IN').length;
    if (otherGuestDetail.length >= totalAllowed) return;
    setOtherGuestError([]);
    if (currentAdults < totalPersons?.adults) {
      setOtherGuestDetail([
        ...otherGuestDetail,
        { firstName: '', lastName: '', gender: 'male', type: 'AD' },
      ]);
    } else if (currentChildren < totalPersons?.children) {
      setOtherGuestDetail([
        ...otherGuestDetail,
        { firstName: '', lastName: '', gender: 'male', type: 'CH' },
      ]);
    } else if (currentInfant < totalPersons?.infants) {
      setOtherGuestDetail([
        ...otherGuestDetail,
        { firstName: '', lastName: '', gender: 'male', type: 'IN' },
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
    if (field.startsWith('gender_')) field = 'gender';
    const updatedGuests = [...otherGuestDetail];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setOtherGuestDetail(updatedGuests);

    if (field === 'firstName' || field === 'lastName') {
      syncLiveNameValidation(formData, updatedGuests);
      return;
    }

    const updatedErrors = [...otherGuestError];
    if (updatedErrors[index]?.[field]) {
      updatedErrors[index] = { ...updatedErrors[index], [field]: '' };
      setOtherGuestError(updatedErrors);
    }
  };

  const convertPassengers = (list) => {
    const result = {
      additional_adults: [],
      children_details: [],
      infants_details: [],
    };
    let adultIndex = 2;
    let childIndex = 1;
    let infantIndex = 1;
    list.forEach((item) => {
      const formatted = {
        index: null,
        gender: item.gender,
        last_name: item.lastName,
        first_name: item.firstName,
      };
      if (item.type === 'AD') {
        formatted.index = adultIndex++;
        result.additional_adults.push(formatted);
      }
      if (item.type === 'CH') {
        formatted.index = childIndex++;
        result.children_details.push(formatted);
      }
      if (item.type === 'IN') {
        formatted.index = infantIndex++;
        result.infants_details.push(formatted);
      }
    });
    return result;
  };

  const handlePayment = async (data) => {
    const domain = window.location.origin;
    const checkoutUrl = window.location;
    const request = {
      booking_reference: data?.booking?.booking_reference,
      success_url: `${domain}/${packageDetail?.category?.slug}/voucher/${data?.booking?.booking_reference}`,
      cancel_url: `${checkoutUrl}`,
    };
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/packages/payment/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
      const response = await res.json();
      if (response?.Success) {
        setConfirmStatus('payment');
        setTimeout(() => {
          setLoading(false);
          router.push(response?.Content?.checkout_url);
        }, 800);
      } else if (response?.success) {
        setConfirmStatus('payment');
        setTimeout(() => {
          setLoading(false);
          router.push(response?.data?.checkout_url || response?.Content?.checkout_url);
        }, 800);
      } else {
        setLoaderError(response?.error?.message || 'Booking failed. Please try again.');
        setConfirmStatus('error');
        setTimeout(() => {
          setLoading(false);
          notifications.show({
            title: 'Error',
            message: response?.error?.message,
            autoClose: 3500,
            color: 'red',
          });
        }, 1000);
      }
    } catch (err) {
      setLoaderError('A network error occurred. Please try again.');
      setConfirmStatus('error');
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;
    setConfirmStatus('pending');
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setConfirmStatus('validate');
    let NewOtherPassenger = {};
    if (otherGuestDetail.length > 0) {
      NewOtherPassenger = convertPassengers(otherGuestDetail);
    }

    const packageCurrency = packageDetail?.currency_code || 'GBP';
    const grandTotal = Number(packageDetail?.total_amount) + servicesTotal;
    let customerCurrency = currency;
    let customerExchangeRate = 1;
    let customerTotalAfterDiscount = grandTotal;

    if (currency !== packageCurrency && rates[packageCurrency] && rates[currency]) {
      const conversion = ConvertPrice(grandTotal, packageCurrency, currency, rates);
      customerCurrency = conversion.newcurrency;
      customerTotalAfterDiscount = parseFloat(conversion.newprice);
      customerExchangeRate = rates[currency] / rates[packageCurrency];
    } else {
      customerCurrency = packageCurrency;
      customerExchangeRate = 1;
      customerTotalAfterDiscount = grandTotal;
    }

    const updatedRooms = expandedRooms.map(
      ({ adultsWB, childrenWB, infantsWB, ...rest }) => ({
        ...rest,
        adults_without_bed: adultsWB,
        children_without_bed: childrenWB,
        infants_without_bed: infantsWB,
      })
    );

    const request = {
      package_id: packageDetail?.id,
      lead_title: formData?.title,
      lead_first_name: formData?.firstName,
      lead_last_name: formData?.lastName,
      lead_email: String(formData?.email || '').trim().toLowerCase(),
      lead_address: formData?.address,
      lead_country: formData?.country,
      lead_phone_code: formData?.phoneCode,
      lead_phone: formData?.phone,
      lead_gender: formData?.gender,
      other_passengers: NewOtherPassenger,
      special_request: formData.requests,
      customer_currency: customerCurrency,
      customer_exchange_rate: customerExchangeRate,
      customer_total_after_discount: customerTotalAfterDiscount,
      room_selections: expandedRooms?.length
        ? updatedRooms
        : packageDetail?.selected_rooms || [],
      additional_services: selectedServices || [],
      grand_total_after_discount: customerTotalAfterDiscount,
      payment_method: paymentMethod === 'bank' ? 'bank_transfer' : 'stripe',
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/packages/booking`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
      const response = await res.json();
      const bookingOk = response?.Success || response?.success;
      const content = response?.Content || response?.data;
      if (bookingOk) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setConfirmStatus('reserve');
        if (paymentMethod === 'bank') {
          const bookingRef =
            content?.booking?.booking_reference || content?.booking_reference;
          setConfirmStatus('success');
          setTimeout(() => {
            setLoading(false);
            router.push(
              `/${packageDetail?.category?.slug}/voucher/${bookingRef}`
            );
          }, 800);
        } else {
          await handlePayment(content);
        }
      } else {
        setLoaderError(response?.error?.message || 'Booking failed. Please try again.');
        setConfirmStatus('error');
        setTimeout(() => {
          setLoading(false);
          notifications.show({
            title: 'Error',
            message: response?.error?.message || 'Booking failed. Please try again.',
            autoClose: 3500,
            color: 'red',
          });
        }, 1000);
      }
    } catch (err) {
      setLoaderError('A network error occurred. Please try again.');
      setConfirmStatus('error');
      setTimeout(() => setLoading(false), 1000);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: handleCheckout,
  }));

  const totalAllowed =
    totalPersons?.adults + totalPersons?.children + totalPersons?.infants;

  return (
    <div className={styles.formWrap}>
      <LeadDetail setFormData={setFormData} />
      {loading && (
        <PackageBookingLoader
          errorMessage={loaderError}
          showLoader={loading}
          onComplete={() => { }}
          confirmStatus={confirmStatus}
          componentName="Package"
        />
      )}

      {/* Passengers count */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon} aria-hidden="true">
            <FaUsers size={15} />
          </span>
          <h3 className={styles.cardTitle}>Number of Passengers</h3>
        </div>
        <div className={styles.passengerCountBox}>
          <span className={styles.passengerCountValue}>
            {passengerCount ||
              (totalPersons.adults + 1) +
              totalPersons.children +
              totalPersons.infants}
          </span>
          <span className={styles.passengerCountLabel}>
            guests from your room selection
          </span>
        </div>
      </div>

      {/* Lead passenger */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon} aria-hidden="true">
            <FaUsers size={14} />
          </span>
          <h3 className={styles.cardTitle}>Lead Passenger Details</h3>
        </div>

        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.span2}`}>
            <label className={styles.label} htmlFor="lead-title">
              Title<span className={styles.req}>*</span>
            </label>
            <select
              id="lead-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`${styles.input} ${errors.title ? styles.invalid : ''}`}
            >
              <option value="">Select</option>
              <option value="MR">Mr</option>
              <option value="MRS">Mrs</option>
              <option value="MISS">Miss</option>
              <option value="MS">Ms</option>
              <option value="DR">Dr</option>
            </select>
            {errors.title && <div className={styles.error}>{errors.title}</div>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lead-firstName">
              First Name<span className={styles.req}>*</span>
            </label>
            <input
              id="lead-firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`${styles.input} ${errors.firstName ? styles.invalid : ''}`}
              placeholder="First Name"
              autoComplete="given-name"
              maxLength={35}
            />
            {errors.firstName && (
              <div className={styles.error}>{errors.firstName}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lead-lastName">
              Last Name<span className={styles.req}>*</span>
            </label>
            <input
              id="lead-lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`${styles.input} ${errors.lastName ? styles.invalid : ''}`}
              placeholder="Last Name"
              autoComplete="family-name"
              maxLength={35}
            />
            {errors.lastName && (
              <div className={styles.error}>{errors.lastName}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lead-email">
              Email Address<span className={styles.req}>*</span>
            </label>
            <input
              id="lead-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.invalid : ''}`}
              placeholder="Email Address"
              autoComplete="email"
              maxLength={200}
            />
            {errors.email && <div className={styles.error}>{errors.email}</div>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lead-phone">
              Phone Number<span className={styles.req}>*</span>
            </label>
            <div className={styles.phoneGroup}>
              <span className={styles.phoneCode}>{formData.phoneCode || '+__'}</span>
              <input
                id="lead-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (
                    !/[0-9]/.test(e.key) &&
                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(
                      e.key
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                className={`${styles.input} ${styles.phoneInput} ${errors.phone ? styles.invalid : ''}`}
                placeholder="123456789"
                autoComplete="tel"
              />
            </div>
            {errors.phone && <div className={styles.error}>{errors.phone}</div>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lead-country">
              Country<span className={styles.req}>*</span>
            </label>
            <Select
              id="lead-country"
              placeholder="Select country"
              searchable
              data={countryOptions}
              value={formData.country}
              limit={50}
              onChange={handleCountryChange}
              classNames={{ input: `${styles.mantineInput} ${errors.country ? styles.invalid : ''}` }}
            />
            {errors.country && (
              <div className={styles.error}>{errors.country}</div>
            )}
          </div>
        </div>

        <div className={styles.extraGrid}>
          <div className={`${styles.field} ${styles.span2}`}>
            <label className={styles.label} htmlFor="lead-address">
              Address<span className={styles.req}>*</span>
            </label>
            <Autocomplete
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              placeholder="House No. / Street"
              type="text"
              className={`${styles.input} ${errors.address ? styles.invalid : ''}`}
              name="address"
              value={formData.address}
              onChange={handleChange}
              onPlaceSelected={handlePlaceSelected}
              options={{ types: ['address'] }}
            />
            {errors.address && (
              <div className={styles.error}>{errors.address}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Gender<span className={styles.req}>*</span></label>
            <div className={styles.genderRow}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  className={styles.radioInput}
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                  disabled={!!genderFromTitle(formData.title)}
                />
                Male
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  className={styles.radioInput}
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                  disabled={!!genderFromTitle(formData.title)}
                />
                Female
              </label>
            </div>
          </div>


        </div>

        <p className={styles.hint}>
          This information will be used for all booking confirmations and
          communications. Ensure that the name matches travel documents.
        </p>
      </div>

      {/* Other guests */}
      <div className={styles.card}>
        <div className={styles.cardHeaderBetween}>
          <h3 className={styles.cardTitle}>Additional Guests</h3>
          <button
            type="button"
            onClick={handleGuestAdd}
            className={styles.addGuestBtn}
            disabled={otherGuestDetail.length >= totalAllowed}
          >
            + Add Guest
          </button>
        </div>

        {otherGuestDetail.map((item, index) => (
          <div key={index} className={styles.guestBlock}>
            <div className={styles.guestBlockTop}>
              <h4 className={styles.guestHeading}>
                Guest {index + 2}{' '}
                {(item.type === 'CH' || item.type === 'IN') && (
                  <span className={styles.guestType}>
                    {item.type === 'CH' ? 'Child' : 'Infant'}
                  </span>
                )}
              </h4>
              <TiDeleteOutline
                onClick={() => handleGuestRemove(index)}
                className={styles.removeGuest}
                size={20}
              />
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  onChange={(e) => handleGuestChange(e, index)}
                  value={item.firstName}
                  placeholder="First Name"
                  maxLength={35}
                  className={`${styles.input} ${otherGuestError[index]?.firstName ? styles.invalid : ''
                    }`}
                />
                {otherGuestError[index]?.firstName && (
                  <div className={styles.error}>
                    {otherGuestError[index]?.firstName}
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  onChange={(e) => handleGuestChange(e, index)}
                  value={item.lastName}
                  placeholder="Last Name"
                  maxLength={35}
                  className={`${styles.input} ${otherGuestError[index]?.lastName ? styles.invalid : ''
                    }`}
                />
                {otherGuestError[index]?.lastName && (
                  <div className={styles.error}>
                    {otherGuestError[index]?.lastName}
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Gender</label>
                <div className={styles.genderRow}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      className={styles.radioInput}
                      checked={item.gender === 'male'}
                      onChange={(e) => handleGuestChange(e, index)}
                      name={`gender_${index}`}
                      value="male"
                    />
                    Male
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      className={styles.radioInput}
                      checked={item.gender === 'female'}
                      onChange={(e) => handleGuestChange(e, index)}
                      name={`gender_${index}`}
                      value="female"
                    />
                    Female
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Special requests */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Special requests</h3>
        <p className={styles.hint}>
          Special requests cannot be guaranteed – we’ll do our best to fulfill
          them.
        </p>
        <textarea
          className={styles.textarea}
          rows={4}
          name="requests"
          value={formData.requests}
          onChange={handleChange}
          placeholder="Please write your requests in English (optional)"
        />
      </div>

      {/* Payment method */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon} aria-hidden="true">
            <FaCreditCard size={14} />
          </span>
          <h3 className={styles.cardTitle}>Payment Method</h3>
        </div>
        <div className={styles.paymentGrid}>
          <button
            type="button"
            className={`${styles.paymentOption} ${paymentMethod === 'card' ? styles.paymentActive : ''
              }`}
            onClick={() => setPaymentMethod('card')}
          >
            <FaCreditCard size={18} />
            Debit / Credit Card
          </button>
          {/* <button
            type="button"
            className={`${styles.paymentOption} ${paymentMethod === 'bank' ? styles.paymentActive : ''
              }`}
            onClick={() => setPaymentMethod('bank')}
          >
            <FaUniversity size={18} />
            Bank Transfer
          </button> */}
        </div>
        {paymentMethod === 'bank' && (
          <p className={styles.hint}>
            You will complete payment securely after confirming your booking.
          </p>
        )}
      </div>

      {/* Terms */}
      <div className={styles.termsRow}>
        <input
          className={styles.checkbox}
          type="checkbox"
          name="terms"
          id="package-terms"
          checked={formData.terms}
          onChange={handleChange}
        />
        <label htmlFor="package-terms" className={styles.termsLabel}>
          I agree to the{' '}
          <a target="_blank" href="/terms-and-conditions" rel="noreferrer">
            Terms & Conditions
          </a>{' '}
          and Privacy Policy. I confirm all passenger details are correct.
        </label>
      </div>
      {errors.terms && <div className={styles.error}>{errors.terms}</div>}

      {!hideSubmit && (
        <button
          onClick={handleCheckout}
          type="button"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </button>
      )}
    </div>
  );
});

export default GuestForm;