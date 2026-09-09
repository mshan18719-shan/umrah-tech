'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MdTune } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import { Checkbox, RangeSlider, Select, Drawer } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import moment from 'moment';
import PackageFilterLoader from '../Loader/PackageFilterLoader';
import { ConvertPrice } from '../Currency/ConvertPrice';
import { useCurrency } from '@/util/currency';
import { LiaAngleDownSolid } from 'react-icons/lia';

function StarLabel({ count }) {
    return (
        <span className="hotel-filter-star-label" aria-label={`${count} stars`}>
            {Array.from({ length: count }).map((_, i) => (
                <FaStar key={i} className="hotel-filter-star-label__icon" aria-hidden="true" />
            ))}
        </span>
    );
}

function parseFilterDate(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const parsed = moment(value, ['YYYY-MM-DD', moment.ISO_8601], true);
    if (parsed.isValid()) return parsed.toDate();
    const fallback = moment(value);
    return fallback.isValid() ? fallback.toDate() : null;
}

export default function Filter({ category_slug }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const { currency, rates } = useCurrency();
    const resolvedSlug =
        category_slug === 'umrah-packages'
            ? category_slug
            : category_slug || params?.slug || '';
    const prevSlugRef = useRef(resolvedSlug);

    const [searchDate, setSearchDate] = useState(() => parseFilterDate(searchParams.get('date')) || new Date());
    const [calendarMonth, setCalendarMonth] = useState(() => parseFilterDate(searchParams.get('date')) || new Date());
    const [flightFilter, setFlightFilter] = useState([]);
    const [durationFilter, setDurationFilter] = useState([]);
    const [activeDrawer, setActiveDrawer] = useState(null);
    const [priceRange, setPriceRange] = useState([0, 0]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [selectedDurations, setSelectedDurations] = useState(null);
    const [selectedDepartures, setSelectedDepartures] = useState(null);
    const [selectedRating, setSelectedRating] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const urlDate = searchParams.get('date');

    useEffect(() => {
        const date = parseFilterDate(urlDate);
        if (date) {
            setSearchDate(date);
            setCalendarMonth(date);
        }
    }, [urlDate]);

    useEffect(() => {
        const durationsFromURL = searchParams.get('duration');
        const departuresFromURL = searchParams.get('flight_departure');
        const ratingFromURL = searchParams.getAll('star_rating[]');

        setSelectedDurations(durationsFromURL || null);
        setSelectedDepartures(departuresFromURL || null);
        setSelectedRating(ratingFromURL || []);
    }, [searchParams]);

    useEffect(() => {
        const categoryChanged = prevSlugRef.current !== resolvedSlug;
        if (categoryChanged) {
            prevSlugRef.current = resolvedSlug;
            const next = new URLSearchParams(searchParams.toString());
            if (next.has('min_price') || next.has('max_price')) {
                next.delete('min_price');
                next.delete('max_price');
                next.delete('page');
                const qs = next.toString();
                router.replace(qs ? `?${qs}` : window.location.pathname);
            }
        }
        getFilters(urlDate, resolvedSlug, categoryChanged);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlDate, currency, rates, resolvedSlug]);

    async function getFilters(dateParam, slugParam, resetPrice = false) {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (dateParam) query.set('date', dateParam);
            if (slugParam) query.set('category_slug', slugParam);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/packages/filters?${query.toString()}`,
                {
                    cache: 'no-store',
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            const response = await res.json();
            setIsLoading(false);
            setHasLoadedOnce(true);
            if (response.Success) {
                const ListDuration = (response.Content.durations || []).map((item) => ({
                    value: String(item.days),
                    label: item.label,
                }));
                const ListDeparture = (response.Content.flight_departures || []).map((item) => ({
                    value: item.departure,
                    label: item.departure,
                }));
                setFlightFilter(ListDeparture);
                setDurationFilter(ListDuration);

                const apiCurrency = response.Content?.currency_code || 'GBP';
                const rawMin = Number(response.Content?.price_range?.min_price) || 0;
                const rawMax = Number(response.Content?.price_range?.max_price) || rawMin || 1;

                const { newprice: minPriceConverted } = ConvertPrice(
                    rawMin,
                    apiCurrency,
                    currency,
                    rates
                );
                const { newprice: maxPriceConverted } = ConvertPrice(
                    rawMax,
                    apiCurrency,
                    currency,
                    rates
                );
                const nextMin = Number(minPriceConverted) || 0;
                const nextMax = Number(maxPriceConverted) || nextMin || 1;
                setMinPrice(nextMin);
                setMaxPrice(nextMax);

                const minFromURL = searchParams.get('min_price');
                const maxFromURL = searchParams.get('max_price');
                if (
                    !resetPrice &&
                    minFromURL != null &&
                    maxFromURL != null
                ) {
                    const urlMin = Number(minFromURL);
                    const urlMax = Number(maxFromURL);
                    const withinBounds =
                        !Number.isNaN(urlMin) &&
                        !Number.isNaN(urlMax) &&
                        urlMin >= nextMin &&
                        urlMax <= nextMax &&
                        urlMin <= urlMax;
                    setPriceRange(withinBounds ? [urlMin, urlMax] : [nextMin, nextMax]);
                } else {
                    setPriceRange([nextMin, nextMax]);
                }
            }
        } catch (error) {
            setIsLoading(false);
            setHasLoadedOnce(true);
            console.log(error);
        }
    }

    const pushParams = (params) => {
        router.push(`?${params.toString()}`);
    };

    const handleDateChange = (date) => {
        const params = new URLSearchParams(searchParams.toString());
        if (date) {
            const nextDate = date instanceof Date ? date : parseFilterDate(date);
            params.set('date', moment(nextDate).format('YYYY-MM-DD'));
            setSearchDate(nextDate);
            setCalendarMonth(nextDate);
        } else {
            params.delete('date');
        }
        pushParams(params);
    };

    const handlePriceRangeChange = (value) => {
        setPriceRange(value);
    };

    const handlePriceRangeChangeEnd = (value) => {
        setPriceRange(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set('min_price', String(value[0]));
        params.set('max_price', String(value[1]));
        params.delete('page');
        pushParams(params);
    };

    const handleDurationChange = (value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null) {
            params.delete('duration');
        } else {
            params.set('duration', value);
        }
        pushParams(params);
        setSelectedDurations(value);
    };

    const handleDepartureChange = (departure) => {
        const params = new URLSearchParams(searchParams.toString());
        if (departure === null) {
            params.delete('flight_departure');
        } else {
            params.set('flight_departure', departure);
        }
        pushParams(params);
        setSelectedDepartures(departure);
    };

    const handleRatingChange = (value) => {
        const updated = selectedRating.includes(value)
            ? selectedRating.filter((d) => d !== value)
            : [...selectedRating, value];
        updateURL({ star_rating: updated });
        setSelectedRating(updated);
    };

    const updateURL = (newParams) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(newParams).forEach(([key, value]) => {
            params.delete(`${key}[]`);

            if (Array.isArray(value)) {
                value.forEach((v) => {
                    if (v) params.append(`${key}[]`, v);
                });
            } else if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        pushParams(params);
    };

    const handleResetFilters = () => {
        const dateParam = searchParams.get('date');
        setSelectedDurations(null);
        setSelectedDepartures(null);
        setSelectedRating([]);
        setPriceRange([minPrice, maxPrice]);
        setActiveDrawer(null);
        router.push(dateParam ? `?date=${dateParam}` : '?');
    };

    const formatAmount = (value) => {
        const num = Number(value);
        if (Number.isNaN(num)) return value;
        return num.toFixed(2);
    };

    const datePanel = (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Date</p>
            <div className="package-date-filter d-flex justify-content-center">
                <DatePicker
                    minDate={new Date()}
                    value={searchDate}
                    date={calendarMonth}
                    onDateChange={setCalendarMonth}
                    onChange={handleDateChange}
                />
            </div>
        </div>
    );

    const pricePanel = (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Price Per Person</p>
            <RangeSlider
                className="hotel-filter-slider mb-1"
                pushOnOverlap={false}
                value={priceRange}
                onChange={handlePriceRangeChange}
                onChangeEnd={handlePriceRangeChangeEnd}
                min={minPrice}
                max={maxPrice || 1}
                color="#1B3B6F"
                step={1}
                minRange={0}
                label={null}
            />
            <div className="hotel-filter-price-values">
                <div className="hotel-filter-price-badge">
                    Min
                    <strong>
                        {currency} {formatAmount(priceRange[0])}
                    </strong>
                </div>
                <div className="hotel-filter-price-badge">
                    Max
                    <strong>
                        {currency} {formatAmount(priceRange[1])}
                    </strong>
                </div>
            </div>
        </div>
    );

    const ratingPanel = (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Property Rating</p>
            <div className="hotel-filter-checkbox-group">
                {['5', '4', '3', '2', '1'].map((star) => (
                    <Checkbox
                        key={star}
                        checked={selectedRating.includes(star)}
                        onChange={() => handleRatingChange(star)}
                        className="hotel-filter-checkbox"
                        value={star}
                        label={<StarLabel count={Number(star)} />}
                    />
                ))}
            </div>
        </div>
    );

    const durationPanel = (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Duration</p>
            <Select
                searchable
                clearable
                data={durationFilter}
                value={selectedDurations}
                onChange={handleDurationChange}
                placeholder="Select Duration"
                className="hotel-filter-select"
            />
        </div>
    );

    const departurePanel = (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Departure From</p>
            <Select
                searchable
                clearable
                data={flightFilter}
                value={selectedDepartures}
                onChange={handleDepartureChange}
                placeholder="Select Departure From"
                className="hotel-filter-select"
            />
        </div>
    );

    const clearAllLink = (
        <button type="button" className="hotel-filter-clear-all" onClick={handleResetFilters}>
            Clear all
        </button>
    );

    const drawerFooter = (
        <>
            <div className="mt-2 mb-2">{clearAllLink}</div>
            <div className="border-top pt-3 mt-3">
                <button
                    type="button"
                    className="hotel-filter-done-btn"
                    onClick={() => setActiveDrawer(null)}
                >
                    Done
                </button>
            </div>
        </>
    );

    return (
        <div className="package-listing-filters">
            <div className="filter-scroll d-flex gap-2 d-md-none mb-3">
                <button type="button" onClick={() => setActiveDrawer('date')} className="filter-pill">
                    Date <span className="arrow"><LiaAngleDownSolid /></span>
                </button>
                <button type="button" onClick={() => setActiveDrawer('price')} className="filter-pill">
                    Price <span className="arrow"><LiaAngleDownSolid /></span>
                </button>
                <button type="button" onClick={() => setActiveDrawer('rating')} className="filter-pill">
                    Rating <span className="arrow"><LiaAngleDownSolid /></span>
                </button>
                <button type="button" onClick={() => setActiveDrawer('duration')} className="filter-pill">
                    Duration <span className="arrow"><LiaAngleDownSolid /></span>
                </button>
                <button type="button" onClick={() => setActiveDrawer('departure')} className="filter-pill">
                    Departure From <span className="arrow"><LiaAngleDownSolid /></span>
                </button>
            </div>

            <div className="hotel-filter-sidebar d-none d-md-flex">
                <div className="hotel-filter-panel-header">
                    <div className="hotel-filter-sidebar__header">
                        <div className="hotel-filter-sidebar__header-left">
                            <MdTune className="hotel-filter-sidebar__icon" size={20} aria-hidden="true" />
                            <p className="hotel-filter-sidebar__title">Filters</p>
                        </div>
                        {clearAllLink}
                    </div>
                </div>

                {isLoading && !hasLoadedOnce ? (
                    <div className="hotel-filter-panel">
                        <PackageFilterLoader />
                    </div>
                ) : (
                    <>
                        <div className="hotel-filter-panel">{datePanel}</div>
                        <div className="hotel-filter-panel">{pricePanel}</div>
                        <div className="hotel-filter-panel">{ratingPanel}</div>
                        <div className="hotel-filter-panel">{durationPanel}</div>
                        <div className="hotel-filter-panel">{departurePanel}</div>
                    </>
                )}
            </div>

            <Drawer
                opened={activeDrawer === 'date'}
                onClose={() => setActiveDrawer(null)}
                title="Date"
                position="bottom"
                size="60%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                classNames={{ content: 'hotel-filter-drawer' }}
            >
                <div className="mb-2">{datePanel}</div>
                {drawerFooter}
            </Drawer>

            <Drawer
                opened={activeDrawer === 'price'}
                onClose={() => setActiveDrawer(null)}
                title="Price Per Person"
                position="bottom"
                size="48%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                classNames={{ content: 'hotel-filter-drawer' }}
            >
                <div className="mb-2">{pricePanel}</div>
                {drawerFooter}
            </Drawer>

            <Drawer
                opened={activeDrawer === 'rating'}
                onClose={() => setActiveDrawer(null)}
                title="Property Rating"
                position="bottom"
                size="55%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                classNames={{ content: 'hotel-filter-drawer' }}
            >
                <div className="mb-2">{ratingPanel}</div>
                {drawerFooter}
            </Drawer>

            <Drawer
                opened={activeDrawer === 'duration'}
                onClose={() => setActiveDrawer(null)}
                title="Duration"
                position="bottom"
                size="40%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                transitionProps={{ duration: 200 }}
                withinPortal
                lockScroll
                trapFocus={false}
                classNames={{ content: 'hotel-filter-drawer' }}
            >
                <div className="mb-2" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="hotel-filter-section">
                        <p className="hotel-filter-section__label">Duration</p>
                        <Select
                            searchable
                            clearable
                            data={durationFilter}
                            value={selectedDurations}
                            onChange={handleDurationChange}
                            placeholder="Select Duration"
                            withScrollArea={false}
                            maxDropdownHeight={200}
                            comboboxProps={{
                                withinPortal: false,
                                zIndex: 10000,
                                transitionProps: { duration: 0 },
                            }}
                        />
                    </div>
                </div>
                {drawerFooter}
            </Drawer>

            <Drawer
                opened={activeDrawer === 'departure'}
                onClose={() => setActiveDrawer(null)}
                title="Departure From"
                position="bottom"
                size="40%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                transitionProps={{ duration: 200 }}
                withinPortal
                lockScroll
                trapFocus={false}
                classNames={{ content: 'hotel-filter-drawer' }}
            >
                <div className="mb-2" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="hotel-filter-section">
                        <p className="hotel-filter-section__label">Departure From</p>
                        <Select
                            searchable
                            clearable
                            data={flightFilter}
                            value={selectedDepartures}
                            onChange={handleDepartureChange}
                            placeholder="Select Departure From"
                            withScrollArea={false}
                            maxDropdownHeight={200}
                            comboboxProps={{
                                withinPortal: false,
                                zIndex: 10000,
                                transitionProps: { duration: 0 },
                            }}
                        />
                    </div>
                </div>
                {drawerFooter}
            </Drawer>
        </div>
    );
}
