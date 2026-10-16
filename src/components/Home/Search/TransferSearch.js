"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DateTimePicker } from "@mantine/dates";
import { Popover } from '@mantine/core';
import "@mantine/dates/styles.css";
import { notifications } from "@mantine/notifications";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import moment from "moment";
import { FaCalendarAlt, FaUsers, FaMinus, FaPlus, FaSearch } from "react-icons/fa";
import { IoIosSwap } from "react-icons/io";
import TransferLocationSelector from './TransferLocationSelector';
import homeStyles from './FlightSearchHome.module.css';
import listingStyles from './UmrahGetAwayListing.module.css';

const parseCoord = (value) => {
    const n = typeof value === 'function' ? value() : Number(value);
    return Number.isFinite(n) ? n : null;
};

const getPassengerLabel = (adults, children, infants) => {
    const parts = [];
    const a = Number(adults) || 0;
    const c = Number(children) || 0;
    const i = Number(infants) || 0;
    if (a > 0) parts.push(`${a} Adult${a !== 1 ? 's' : ''}`);
    if (c > 0) parts.push(`${c} Child${c !== 1 ? 'ren' : ''}`);
    if (i > 0) parts.push(`${i} Infant${i !== 1 ? 's' : ''}`);
    return parts.length ? parts.join(', ') : 'Select passengers';
};

export default function TransferSearch({ onSearch, variant = 'home' }) {
    const isListing = variant === 'listing';
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isMobile, setIsMobile] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [popoverOpened, setPopoverOpened] = useState(false);
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
        adults: 1,
        children: 0,
        infants: 0,
    });

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);

        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        if (pathname === '/transfers') {
            const transferType = searchParams.get('transferType') || searchParams.get('transfertype');
            const fromLat = searchParams.get('pickupLatitude') || searchParams.get('fromLat');
            const fromLng = searchParams.get('pickupLongitude') || searchParams.get('fromLng');
            const pickupLocation = searchParams.get('pickupLocation') || searchParams.get('pickuplocation');
            const fromCountry = searchParams.get('fromCountry');
            const toLat = searchParams.get('dropoffLatitude') || searchParams.get('toLat');
            const toLng = searchParams.get('dropoffLongitude') || searchParams.get('toLng');
            const dropoffLocation = searchParams.get('dropoffLocation') || searchParams.get('dropofflocation');
            const toCountry = searchParams.get('toCountry');
            const pickupDate = searchParams.get('pickupDate');
            const pickupTime = searchParams.get('pickupTime');
            const dropoffDate = searchParams.get('dropoffDate');
            const dropoffTime = searchParams.get('dropoffTime');
            const passengers = searchParams.get('passengers');
            const adultsParam = searchParams.get('adults');
            const childrenParam = searchParams.get('children');
            const infantsParam = searchParams.get('infants');

            if (transferType || fromLat || toLat || pickupDate) {
                const adults = adultsParam != null
                    ? Math.max(1, Number(adultsParam) || 1)
                    : Math.max(1, Number(passengers) || 1);
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
                    pickupDateTime: pickupDate && pickupTime
                        ? moment(`${pickupDate} ${pickupTime}`, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm']).toDate()
                        : null,
                    dropoffDateTime: dropoffDate && dropoffTime
                        ? moment(`${dropoffDate} ${dropoffTime}`, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm']).toDate()
                        : null,
                    adults,
                    children: Math.max(0, Number(childrenParam) || 0),
                    infants: Math.max(0, Number(infantsParam) || 0),
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
                    adults: 1,
                    children: 0,
                    infants: 0,
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

    const handleCountChange = (type, increment) => {
        setFormData((prev) => {
            const next = { ...prev };
            if (type === 'adults') {
                next.adults = increment
                    ? Math.min(16, Number(prev.adults) + 1)
                    : Math.max(1, Number(prev.adults) - 1);
            } else if (type === 'children') {
                next.children = increment
                    ? Math.min(16, Number(prev.children) + 1)
                    : Math.max(0, Number(prev.children) - 1);
            } else if (type === 'infants') {
                next.infants = increment
                    ? Math.min(16, Number(prev.infants) + 1)
                    : Math.max(0, Number(prev.infants) - 1);
            }
            return next;
        });
    };

    const handleFromLocationChange = (e) => {
        const name = e.target.value;
        setFormData((prev) => ({
            ...prev,
            from: {
                id: "",
                name,
                lat: null,
                lng: null,
                city: "",
                country: "",
            }
        }));
    };

    const handleToLocationChange = (e) => {
        const name = e.target.value;
        setFormData((prev) => ({
            ...prev,
            to: {
                id: "",
                name,
                lat: null,
                lng: null,
                city: "",
                country: "",
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

        const lat = parseCoord(place.geometry?.location?.lat);
        const lng = parseCoord(place.geometry?.location?.lng);
        if (lat == null || lng == null) {
            notifications.show({
                title: 'Location Error',
                message: 'Could not get coordinates for this pickup location. Please select again.',
                color: 'red',
            });
            return;
        }
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

        const lat = parseCoord(place.geometry?.location?.lat);
        const lng = parseCoord(place.geometry?.location?.lng);
        if (lat == null || lng == null) {
            notifications.show({
                title: 'Location Error',
                message: 'Could not get coordinates for this drop-off location. Please select again.',
                color: 'red',
            });
            return;
        }
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

        if (parseCoord(formData.from.lat) == null || parseCoord(formData.from.lng) == null) {
            notifications.show({
                title: 'Validation Error',
                message: isLoadingDetail
                    ? 'Please wait while we load the pickup location details'
                    : 'Please select a pickup location from the list so we can get its coordinates',
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

        if (
            formData.tripType !== 'all-round' &&
            (parseCoord(formData.to.lat) == null || parseCoord(formData.to.lng) == null)
        ) {
            notifications.show({
                title: 'Validation Error',
                message: isLoadingDetail
                    ? 'Please wait while we load the drop-off location details'
                    : 'Please select a drop-off location from the list so we can get its coordinates',
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

        if (!formData.adults || Number(formData.adults) < 1) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select at least 1 adult',
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

        const adults = Math.max(1, Number(formData.adults) || 1);
        const children = Math.max(0, Number(formData.children) || 0);
        const infants = Math.max(0, Number(formData.infants) || 0);
        const totalPassengers = adults + children + infants;
        const fromLat = parseCoord(formData.from.lat);
        const fromLng = parseCoord(formData.from.lng);
        const toLat = parseCoord(formData.to.lat);
        const toLng = parseCoord(formData.to.lng);

        const queryParams = new URLSearchParams();
        queryParams.set('transferType', formData.tripType);
        queryParams.set('pickupLatitude', String(fromLat));
        queryParams.set('pickupLongitude', String(fromLng));
        queryParams.set('pickupLocation', formData.from.name || '');
        // Keep legacy keys for checkout / map embeds
        queryParams.set('fromLat', String(fromLat));
        queryParams.set('fromLng', String(fromLng));
        if (formData.from.country) {
            queryParams.set('fromCountry', formData.from.country);
        }
        if (formData.tripType !== 'all-round') {
            queryParams.set('dropoffLatitude', String(toLat));
            queryParams.set('dropoffLongitude', String(toLng));
            queryParams.set('dropoffLocation', formData.to.name || '');
            queryParams.set('toLat', String(toLat));
            queryParams.set('toLng', String(toLng));
            if (formData.to.country) {
                queryParams.set('toCountry', formData.to.country);
            }
        }
        queryParams.set('pickupDate', moment(formData.pickupDateTime).format('YYYY-MM-DD'));
        queryParams.set('pickupTime', moment(formData.pickupDateTime).format('HH:mm'));
        if (formData.dropoffDateTime) {
            queryParams.set('dropoffDate', moment(formData.dropoffDateTime).format('YYYY-MM-DD'));
            queryParams.set('dropoffTime', moment(formData.dropoffDateTime).format('HH:mm'));
        }
        queryParams.set('adults', String(adults));
        queryParams.set('children', String(children));
        queryParams.set('infants', String(infants));
        queryParams.set('passengers', String(totalPassengers));
        queryParams.set('_ts', String(Date.now()));
        if (onSearch) onSearch();
        router.push(`/transfers?${queryParams.toString()}`);
    };

    const passengerLabel = getPassengerLabel(formData.adults, formData.children, formData.infants);

    const travelersPopoverContent = (
        <div className="p-2" style={{ minWidth: 260 }}>
            <div className="e484bb5b7a mt-2">
                <div className="c5aae0350e">
                    <label className="small mb-0 fw-semibold">Adults</label>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Age 12+</div>
                </div>
                <div className="e301a14002">
                    <div className="e301a14002">
                        <button type="button" onClick={() => handleCountChange('adults', false)} className="adult-modal-btn"><FaMinus /></button>
                        <span className="mx-2" aria-hidden="true">{formData.adults}</span>
                        <button type="button" onClick={() => handleCountChange('adults', true)} className="adult-modal-btn"><FaPlus /></button>
                    </div>
                </div>
            </div>
            <div className="e484bb5b7a mt-3">
                <div className="c5aae0350e">
                    <label className="small mb-0 fw-semibold">Children</label>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Age 2–11</div>
                </div>
                <div className="e301a14002">
                    <div className="e301a14002">
                        <button type="button" onClick={() => handleCountChange('children', false)} className="adult-modal-btn"><FaMinus /></button>
                        <span className="mx-2" aria-hidden="true">{formData.children}</span>
                        <button type="button" onClick={() => handleCountChange('children', true)} className="adult-modal-btn"><FaPlus /></button>
                    </div>
                </div>
            </div>
            <div className="e484bb5b7a mt-3">
                <div className="c5aae0350e">
                    <label className="small mb-0 fw-semibold">Infants</label>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Under 2</div>
                </div>
                <div className="e301a14002">
                    <div className="e301a14002">
                        <button type="button" onClick={() => handleCountChange('infants', false)} className="adult-modal-btn"><FaMinus /></button>
                        <span className="mx-2" aria-hidden="true">{formData.infants}</span>
                        <button type="button" onClick={() => handleCountChange('infants', true)} className="adult-modal-btn"><FaPlus /></button>
                    </div>
                </div>
            </div>
            <button
                onClick={() => setPopoverOpened(false)}
                type="button"
                className="btn mt-3 w-100 btn-outline-success"
            >
                Done
            </button>
        </div>
    );

    const travelersPopover = (
        <Popover
            width={300}
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-end"
            withArrow
            shadow="md"
            clickOutsideEvents={["mouseup", "touchend"]}
        >
            <Popover.Target>
                <button
                    type="button"
                    className={homeStyles.filterPill}
                    onClick={() => setPopoverOpened((o) => !o)}
                    aria-label="Passengers"
                    style={{
                        minWidth: 160,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        borderRadius: 999,
                        padding: '8px 14px',
                        fontWeight: 600,
                    }}
                >
                    <FaUsers size={14} />
                    {passengerLabel}
                </button>
            </Popover.Target>
            <Popover.Dropdown>
                {travelersPopoverContent}
            </Popover.Dropdown>
        </Popover>
    );

    const renderHomeFilters = () => (
        <div className={homeStyles.filtersRow}>
            <div className="flight-type gap-2 d-flex search-radio-butons align-items-center">
                <div
                    onClick={() => handleChange("tripType", "one-way")}
                    className={`${formData.tripType === 'one-way' ? 'active' : ''} small`}
                >
                    <span>One-Way</span>
                </div>
                <div
                    onClick={() => handleChange("tripType", "return")}
                    className={`${formData.tripType === 'return' ? 'active' : ''} small`}
                >
                    <span>Return</span>
                </div>
                <div
                    onClick={() => handleChange("tripType", "all-round")}
                    className={`${formData.tripType === 'all-round' ? 'active' : ''} small`}
                >
                    <span>All-Round</span>
                </div>
            </div>
            {travelersPopover}
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
        <Popover
            width={300}
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-start"
            withArrow
            shadow="md"
            clickOutsideEvents={["mouseup", "touchend"]}
        >
            <Popover.Target>
                <div
                    className={`${listingStyles.listingField} cursor-pointer`}
                    onClick={() => setPopoverOpened((o) => !o)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setPopoverOpened((o) => !o)}
                >
                    <div className={`${listingStyles.fieldIcon} ${listingStyles.iconNavy}`}><FaUsers /></div>
                    <div className={listingStyles.fieldBody}>
                        <span className={listingStyles.fieldLabel}>PASSENGERS</span>
                        <button type="button" className={listingStyles.travelersBtn || listingStyles.fieldValue}>
                            {passengerLabel}
                        </button>
                    </div>
                </div>
            </Popover.Target>
            <Popover.Dropdown>
                {travelersPopoverContent}
            </Popover.Dropdown>
        </Popover>
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