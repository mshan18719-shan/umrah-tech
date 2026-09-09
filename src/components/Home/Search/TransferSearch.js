"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DateTimePicker } from "@mantine/dates";
import { Select, SelectItem } from '@mantine/core';
import "@mantine/dates/styles.css";
import { notifications } from "@mantine/notifications";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import moment from "moment";
import { FaCalendarAlt, FaUsers } from "react-icons/fa";
import { IoIosSwap } from "react-icons/io";
import TransferLocationSelector from './TransferLocationSelector';
import homeStyles from './FlightSearchHome.module.css';
import listingStyles from './UmrahGetAwayListing.module.css';
import { FaSearch } from 'react-icons/fa';

const ADULT_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);

export default function TransferSearch({ onSearch, variant = 'home' }) {
    const isListing = variant === 'listing';
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isMobile, setIsMobile] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [formData, setFormData] = useState({
        tripType: "one-way",
        from: {
            id: "",
            name: "",
            lat: null,
            lng: null,
            city: "",
            country: ""
        },
        to: {
            id: "",
            name: "",
            lat: null,
            lng: null,
            city: "",
            country: ""
        },
        pickupDateTime: null,
        dropoffDateTime: null,
        adults: ''
    });

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);

        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        if (pathname === '/transfers') {
            const transferType = searchParams.get('transferType');
            const fromLat = searchParams.get('fromLat');
            const fromLng = searchParams.get('fromLng');
            const pickupLocation = searchParams.get('pickupLocation');
            const fromCountry = searchParams.get('fromCountry');
            const toLat = searchParams.get('toLat');
            const toLng = searchParams.get('toLng');
            const dropoffLocation = searchParams.get('dropoffLocation');
            const toCountry = searchParams.get('toCountry');
            const pickupDate = searchParams.get('pickupDate');
            const pickupTime = searchParams.get('pickupTime');
            const dropoffDate = searchParams.get('dropoffDate');
            const dropoffTime = searchParams.get('dropoffTime');
            const passengers = searchParams.get('passengers');

            if (transferType || fromLat || toLat || pickupDate) {
                setFormData({
                    tripType: transferType || "one-way",
                    from: {
                        id: "",
                        name: pickupLocation || "",
                        lat: fromLat ? parseFloat(fromLat) : null,
                        lng: fromLng ? parseFloat(fromLng) : null,
                        city: pickupLocation || "",
                        country: fromCountry || ""
                    },
                    to: {
                        id: "",
                        name: dropoffLocation || "",
                        lat: toLat ? parseFloat(toLat) : null,
                        lng: toLng ? parseFloat(toLng) : null,
                        city: dropoffLocation || "",
                        country: toCountry || ""
                    },
                    pickupDateTime: pickupDate && pickupTime ? moment(`${pickupDate} ${pickupTime}`, 'YYYY-MM-DD HH:mm:ss').toDate() : null,
                    dropoffDateTime: dropoffDate && dropoffTime ? moment(`${dropoffDate} ${dropoffTime}`, 'YYYY-MM-DD HH:mm:ss').toDate() : null,
                    adults: passengers || ''
                });
            } else {
                setFormData({
                    tripType: "one-way",
                    from: {
                        id: "",
                        name: "",
                        lat: null,
                        lng: null,
                        city: "",
                        country: ""
                    },
                    to: {
                        id: "",
                        name: "",
                        lat: null,
                        lng: null,
                        city: "",
                        country: ""
                    },
                    pickupDateTime: null,
                    dropoffDateTime: null,
                    adults: ''
                });
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pathname, searchParams]);

    const handleChange = (field, value) => {
        if (field === 'pickupDateTime') {
            setFormData((prev) => ({
                ...prev,
                dropoffDateTime: null,
                pickupDateTime: value,
            }));
            return;
        }
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleFromLocationChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            from: {
                ...prev.from,
                name: e.target.value
            }
        }));
    };

    const handleToLocationChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            to: {
                ...prev.to,
                name: e.target.value
            }
        }));
    };

    const handleSwap = () => {
        setFormData((prev) => ({
            ...prev,
            from: prev.to,
            to: prev.from,
        }));
    };

    const handleFromPlaceSelected = useCallback((place) => {
        if (!place.geometry) {
            console.error('No geometry in place object');
            return;
        }

        const lat = place.geometry?.location?.lat;
        const lng = place.geometry?.location?.lng;
        const placeId = place.place_id;
        const placeName = place.displayName || place.formatted_address || place.name;

        let city = "";
        let country = "";

        if (place.address_components) {
            place.address_components.forEach(component => {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                } else if (component.types.includes('postal_town')) {
                    city = component.long_name;
                }
                if (component.types.includes('country')) {
                    country = component.long_name;
                }
            });
        }

        setFormData((prev) => ({
            ...prev,
            from: {
                id: placeId,
                name: placeName,
                lat,
                lng,
                city,
                country
            },
        }));
    }, []);

    const handleToPlaceSelected = useCallback((place) => {
        if (!place.geometry) {
            console.error('No geometry in place object');
            return;
        }

        const lat = place.geometry?.location?.lat;
        const lng = place.geometry?.location?.lng;
        const placeId = place.place_id;
        const placeName = place.displayName || place.formatted_address || place.name;

        let city = "";
        let country = "";

        if (place.address_components) {
            place.address_components.forEach(component => {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                } else if (component.types.includes('postal_town')) {
                    city = component.long_name;
                }
                if (component.types.includes('country')) {
                    country = component.long_name;
                }
            });
        }

        setFormData((prev) => ({
            ...prev,
            to: {
                id: placeId,
                name: placeName,
                lat,
                lng,
                city,
                country
            },
        }));
    }, []);

    const validateForm = () => {
        if (!formData.from.name) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select a pickup location',
                color: 'red',
            });
            return false;
        }

        if (!formData.to.name && formData.tripType !== 'all-round') {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select a drop-off location',
                color: 'red',
            });
            return false;
        }

        if (!formData.pickupDateTime) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select pickup date and time',
                color: 'red',
            });
            return false;
        }

        if (!formData.adults) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select number of adults',
                color: 'red',
            });
            return false;
        }

        if (formData.tripType === 'return' && !formData.dropoffDateTime) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select return date and time for return trip',
                color: 'red',
            });
            return false;
        }

        const now = new Date();
        if (formData.pickupDateTime < now) {
            notifications.show({
                title: 'Validation Error',
                message: 'Pickup date and time cannot be in the past',
                color: 'red',
            });
            return false;
        }

        if (formData.tripType === 'return' && formData.dropoffDateTime) {
            if (formData.dropoffDateTime <= formData.pickupDateTime) {
                notifications.show({
                    title: 'Validation Error',
                    message: 'Return date and time must be after pickup date and time',
                    color: 'red',
                });
                return false;
            }
        }

        return true;
    };

    const handleSearch = () => {
        if (!validateForm()) {
            return;
        }

        const queryParams = new URLSearchParams();
        queryParams.append('transferType', formData.tripType);
        queryParams.append('fromLat', formData.from.lat);
        queryParams.append('fromLng', formData.from.lng);
        queryParams.append('pickupLocation', formData.from.name);
        queryParams.append('fromCountry', formData.from.country);
        queryParams.append('toLat', formData.to.lat);
        queryParams.append('toLng', formData.to.lng);
        queryParams.append('dropoffLocation', formData.to.name);
        queryParams.append('pickupDate', moment(formData.pickupDateTime).format('YYYY-MM-DD'));
        queryParams.append('pickupTime', moment(formData.pickupDateTime).format('HH:mm:ss'));
        if (formData.dropoffDateTime) {
            queryParams.append('dropoffDate', moment(formData.dropoffDateTime).format('YYYY-MM-DD'));
            queryParams.append('dropoffTime', moment(formData.dropoffDateTime).format('HH:mm:ss'));
        }
        queryParams.append('passengers', formData.adults);
        if (onSearch) onSearch();
        router.push(`/transfers?${queryParams.toString()}`);
    };

    const renderHomeFilters = () => (
        <div className={homeStyles.filtersRow}>
            <Select
                className={homeStyles.filterPill}
                value={formData.tripType}
                onChange={(value) => handleChange("tripType", value)}
                data={[
                    { value: "one-way", label: "One way" },
                    { value: "return", label: "Return" },
                    { value: "all-round", label: "All round" },
                ]}
                aria-label="Trip type"
            />
            <Select
                className={homeStyles.filterPill}
                value={formData.adults}
                onChange={(value) => handleChange("adults", value)}
                data={ADULT_OPTIONS.map((n) => ({
                    value: String(n),
                    label: String(n),
                }))}
                placeholder="Number of adults"
                aria-label="Number of adults"
            />
        </div>
    );

    const renderDateTimeField = (variant) => {
        const isPickup = variant === 'pickup';
        const label = isPickup ? 'Pickup Date/Time' : 'Return Date/Time';
        const value = isPickup ? formData.pickupDateTime : formData.dropoffDateTime;
        const isReturnDisabled = !isPickup && formData.tripType === 'one-way';

        return (
            <div className={`${homeStyles.dateField} ${isReturnDisabled ? homeStyles.dateFieldMuted : ''}`}>
                <div className={homeStyles.dateFieldHeader}>
                    <FaCalendarAlt />
                    <span>{label}</span>
                </div>
                <div className={homeStyles.dateFieldValue}>
                    <DateTimePicker
                        variant="unstyled"
                        placeholder={isPickup ? 'Pick up date and time' : 'Return date and time'}
                        valueFormat="MMM DD, ddd HH:mm"
                        value={value}
                        onChange={(date) => handleChange(isPickup ? 'pickupDateTime' : 'dropoffDateTime', date)}
                        minDate={isPickup ? new Date() : (formData.pickupDateTime || new Date())}
                        readOnly={isReturnDisabled}
                        styles={{
                            input: {
                                WebkitAppearance: 'none',
                                appearance: 'none',
                                backgroundColor: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                minHeight: 'unset',
                                height: 'auto',
                                fontWeight: 700,
                                fontSize: 17,
                                padding: 0,
                                color: '#111827',
                            },
                        }}
                    />
                </div>
            </div>
        );
    };

    const renderListingDateTimeField = (fieldVariant) => {
        const isPickup = fieldVariant === 'pickup';
        const label = isPickup ? 'PICKUP DATE/TIME' : 'RETURN DATE/TIME';
        const value = isPickup ? formData.pickupDateTime : formData.dropoffDateTime;
        const isReturnDisabled = !isPickup && formData.tripType === 'one-way';

        return (
            <div className={listingStyles.listingField} style={isReturnDisabled ? { opacity: 0.45, pointerEvents: 'none' } : undefined}>
                <div className={`${listingStyles.fieldIcon} ${listingStyles.iconNavy}`}><FaCalendarAlt /></div>
                <div className={listingStyles.fieldBody}>
                    <span className={listingStyles.fieldLabel}>{label}</span>
                    <div className={listingStyles.fieldValue}>
                        <DateTimePicker
                            variant="unstyled"
                            placeholder={isPickup ? 'Pick up date and time' : 'Return date and time'}
                            valueFormat="DD MMM YYYY HH:mm"
                            value={value}
                            onChange={(date) => handleChange(isPickup ? 'pickupDateTime' : 'dropoffDateTime', date)}
                            minDate={isPickup ? new Date() : (formData.pickupDateTime || new Date())}
                            readOnly={isReturnDisabled}
                            styles={{
                                input: {
                                    WebkitAppearance: 'none',
                                    appearance: 'none',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    boxShadow: 'none',
                                    minHeight: 'unset',
                                    height: 'auto',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    padding: 0,
                                    color: '#1B3B6F',
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderListingAdultsField = () => (
        <div className={listingStyles.listingField}>
            <div className={`${listingStyles.fieldIcon} ${listingStyles.iconNavy}`}><FaUsers /></div>
            <div className={listingStyles.fieldBody}>
                <span className={listingStyles.fieldLabel}>ADULTS</span>
                <div className={listingStyles.fieldValue}>
                    <Select
                        className={listingStyles.selectInput}
                        value={formData.adults}
                        onChange={(value) => handleChange("adults", value)}
                        data={ADULT_OPTIONS.map((n) => ({
                            value: String(n),
                            label: String(n),
                        }))}
                        placeholder="Select adults"
                        aria-label="Number of adults"
                        styles={{
                            input: {
                                WebkitAppearance: 'none',
                                appearance: 'none',
                                backgroundColor: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                minHeight: 'unset',
                                height: 'auto',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                padding: 0,
                                color: '#1B3B6F',
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );

    const tripToggle = (
        <>
            <div
                onClick={() => handleChange("tripType", "one-way")}
                className={`${listingStyles.toggleItem} ${formData.tripType === 'one-way' ? listingStyles.toggleActive : ''}`}
            >
                One-Way
            </div>
            <div
                onClick={() => handleChange("tripType", "return")}
                className={`${listingStyles.toggleItem} ${formData.tripType === 'return' ? listingStyles.toggleActive : ''}`}
            >
                Return
            </div>
            <div
                onClick={() => handleChange("tripType", "all-round")}
                className={`${listingStyles.toggleItem} ${formData.tripType === 'all-round' ? listingStyles.toggleActive : ''}`}
            >
                All-Round
            </div>
        </>
    );

    if (isListing) {
        return (
            <div className={listingStyles.wrapper}>
                {/* <button type="button" className={listingStyles.backRow} onClick={() => router.back()}>
                    <span>&#8249;</span> Back
                </button> */}
                <div className={listingStyles.searchRow}>
                    <div className={listingStyles.toggleGroup}>{tripToggle}</div>
                    <div className={listingStyles.inputSearches}>
                        <div className={listingStyles.fieldsCard}>
                            <div className={listingStyles.fieldsRow}>
                                <div className={listingStyles.locationsGroup}>
                                    <TransferLocationSelector
                                        value={formData.from.name}
                                        onChange={handleFromLocationChange}
                                        detailLoader={setIsLoadingDetail}
                                        onPlaceSelected={handleFromPlaceSelected}
                                        isMobile={false}
                                        placeholder="Pickup Location?"
                                        fieldLabel="Pickup"
                                        inputName="pickupLocation"
                                        variant="listing"
                                        city={formData.from.city}
                                        country={formData.from.country}
                                    />
                                    <button type="button" className={listingStyles.swapBtn} onClick={handleSwap} aria-label="Swap locations">
                                        <IoIosSwap />
                                    </button>
                                    <TransferLocationSelector
                                        value={formData.to.name}
                                        onChange={handleToLocationChange}
                                        detailLoader={setIsLoadingDetail}
                                        onPlaceSelected={handleToPlaceSelected}
                                        isMobile={false}
                                        placeholder="Drop off Location?"
                                        fieldLabel="Drop off"
                                        inputName="dropoffLocation"
                                        variant="listing"
                                        city={formData.to.city}
                                        country={formData.to.country}
                                    />
                                </div>
                                {renderListingAdultsField()}
                                {renderListingDateTimeField('pickup')}
                                {renderListingDateTimeField('return')}
                            </div>
                        </div>
                        <button
                            type="button"
                            className={listingStyles.searchBtn}
                            onClick={handleSearch}
                            disabled={isLoadingDetail}
                        >
                            <FaSearch /> Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={homeStyles.wrapper}>
            {renderHomeFilters()}
            <div className={homeStyles.searchBar}>
                <div className={homeStyles.fieldsRow}>
                    <div className={homeStyles.fromWrap}>
                        <TransferLocationSelector
                            value={formData.from.name}
                            onChange={handleFromLocationChange}
                            detailLoader={setIsLoadingDetail}
                            onPlaceSelected={handleFromPlaceSelected}
                            isMobile={isMobile}
                            placeholder="Pickup Location?"
                            fieldLabel="Pickup"
                            inputName="pickupLocation"
                            variant="home"
                            city={formData.from.city}
                            country={formData.from.country}
                        />
                        <div className={homeStyles.fieldDivider} />
                        <TransferLocationSelector
                            value={formData.to.name}
                            onChange={handleToLocationChange}
                            detailLoader={setIsLoadingDetail}
                            onPlaceSelected={handleToPlaceSelected}
                            isMobile={isMobile}
                            placeholder="Drop off Location?"
                            fieldLabel="Drop off"
                            inputName="dropoffLocation"
                            variant="home"
                            city={formData.to.city}
                            country={formData.to.country}
                        />
                        <button type="button" className={homeStyles.swapBtn} onClick={handleSwap} aria-label="Swap locations">
                            <IoIosSwap />
                        </button>
                    </div>
                    <div className={homeStyles.fieldDivider} />
                    {renderDateTimeField('pickup')}
                    <div className={homeStyles.fieldDivider} />
                    {renderDateTimeField('return')}
                </div>
                <button
                    type="button"
                    className={homeStyles.searchBtn}
                    onClick={handleSearch}
                    disabled={isLoadingDetail}
                >
                    Search
                </button>
            </div>
        </div>
    );
}