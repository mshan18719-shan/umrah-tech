'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Text, Group, Stack, Loader, Alert, Tooltip, Button, Drawer } from '@mantine/core';
import { FaStar, FaClock } from 'react-icons/fa';
import { CiLocationOn } from 'react-icons/ci';
import { MdErrorOutline } from 'react-icons/md';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import moment from 'moment';
import Image from 'next/image';
import styles from './UpdateHotel.module.css';
import { useFilters } from '../Listing/Filter/FilterContext';
import { FiCheckCircle, FiRefreshCw, FiSearch, FiSliders } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import UmrahPagination from '../Listing/UmrahPagination';
export default function UpdateHotelModal({ opened, onClose, pkg, hotel, cityName, onHotelCacheUpdate }) {
    const { googleDistanceCache, fetchSingleDistance } = useFilters();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // keyed by hotel id: { loading, images, address, facilities }
    const [hotelDetailsCache, setHotelDetailsCache] = useState({});

    // Filters
    const [searchText, setSearchText] = useState('');
    const [selectedStars, setSelectedStars] = useState([]);
    const [selectedDistances, setSelectedDistances] = useState([]);
    const [selectedViews, setSelectedViews] = useState([]);
    const [sortBy, setSortBy] = useState('default');
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);
    const itemsPerPage = 10;

    // Confirmation modal state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmHotel, setConfirmHotel] = useState(null);
    const [ratesLoading, setRatesLoading] = useState(false);
    const [ratesError, setRatesError] = useState(null);
    const [convertedPrice, setConvertedPrice] = useState(null);
    const [currencyMismatch, setCurrencyMismatch] = useState(false);
    const daysDiff = moment(hotel?.check_out).diff(moment(hotel?.check_in), 'days');

    const fetchRates = async () => {
        try {
            const response = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_CURRENCY_KEY}/latest/GBP`);
            if (!response.ok) throw new Error('Failed to fetch exchange rates');
            const data = await response.json();
            return data.conversion_rates;
        } catch (error) {
            console.error('Failed to fetch exchange rates', error);
            return null;
        }
    };

    const convertPrice = (price, fromCurrency, toCurrency, ratesMap) => {
        if (!ratesMap || !fromCurrency || !toCurrency) return null;
        if (fromCurrency === toCurrency) return price;
        const fromRate = ratesMap[fromCurrency];
        const toRate = ratesMap[toCurrency];
        if (!fromRate || !toRate) return null;
        return (price / fromRate) * toRate;
    };

    const handleSelectClick = async (item) => {
        setConfirmHotel(item);
        setConvertedPrice(null);
        setRatesError(null);
        const hotelCurrency = item?.metadata?.currency;
        const pkgCurrency = pkg?.currency;
        const isMismatch = hotelCurrency && pkgCurrency && hotelCurrency !== pkgCurrency;
        setCurrencyMismatch(isMismatch);
        if (isMismatch) {
            setRatesLoading(true);
            setConfirmOpen(true);
            const ratesMap = await fetchRates();
            if (ratesMap) {
                const converted = convertPrice(item?.metadata?.min_price, hotelCurrency, pkgCurrency, ratesMap);
                setConvertedPrice(converted);
            } else {
                setRatesError('Unable to fetch exchange rates. Please try again.');
            }
            setRatesLoading(false);
        } else {
            setConfirmOpen(true);
        }
    };

    const handleRetry = async () => {
        if (!confirmHotel) return;
        setRatesError(null);
        setRatesLoading(true);
        const ratesMap = await fetchRates();
        if (ratesMap) {
            const converted = convertPrice(
                confirmHotel?.metadata?.min_price,
                confirmHotel?.metadata?.currency,
                pkg?.currency,
                ratesMap
            );
            setConvertedPrice(converted);
        } else {
            setRatesError('Unable to fetch exchange rates. Please try again.');
        }
        setRatesLoading(false);
    };

    const fetchHotelDetail = useCallback(async (item) => {
        const id = item?.id;
        if (!id) return;
        setHotelDetailsCache(prev => ({ ...prev, [id]: { loading: true } }));
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/basic/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: item.provider,
                    hotelId: item.id,
                    checkIn: hotel?.check_in,
                    checkOut: hotel?.check_out,
                }),
            });
            const res = await response.json();
            setHotelDetailsCache(prev => ({
                ...prev,
                [id]: {
                    loading: false,
                    images: Array.isArray(res.data?.main_images) && res.data.main_images.length > 0
                        ? res.data.main_images[0].url || ''
                        : '',
                    all_images: res.data?.main_images || [],
                    address: res.data?.address || '',
                    facilities: res.data?.facilities || [],
                },
            }));
        } catch {
            setHotelDetailsCache(prev => ({ ...prev, [id]: { loading: false, error: true } }));
        }
    }, [hotel?.check_in, hotel?.check_out]);

    useEffect(() => {
        if (!opened || !hotel || !pkg) return;

        // Reset all filters on every open
        setSearchText('');
        setSelectedStars([]);
        setSelectedDistances([]);
        setSelectedViews([]);
        setSortBy('default');
        setVisibleCount(10);

        const fetchHotels = async () => {
            setLoading(true);
            setError(null);
            setHotels([]);
            setHotelDetailsCache({});

            const request = {
                checkIn: hotel?.check_in,
                checkOut: hotel?.check_out,
                destination: {
                    city: cityName,
                    latitude: hotel?.location?.latitude,
                    longitude: hotel?.location?.longitude,
                    countryCode: 'SA',
                },
                currency: pkg?.currency,
                rooms: pkg?.original_request?.rooms,
            };

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/search`, {
                    method: 'POST',
                    cache: 'no-store',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(request),
                });
                const data = await res.json();
                if (!data.success) {
                    setHotels([]);
                } else {
                    const list = data?.data?.hotels || [];
                    setHotels(list);
                    // fire off detail fetches for every hotel — results stream in independently
                    list.forEach(item => fetchHotelDetail(item));
                    // fetch distances for hotels not already in the shared cache
                    const cityLower = cityName?.toLowerCase().includes('madinah') ? 'madinah' : 'makkah';
                    list.forEach(item => {
                        if (!item?.id || googleDistanceCache[item.id]) return;
                        const label = [item.name, item?.location?.address].filter(Boolean).join(', ');
                        fetchSingleDistance({ id: item.id, hotel: label, city: cityLower, lat: item?.location?.latitude, lon: item?.location?.longitude });
                    });
                }
            } catch (err) {
                console.error('Hotel search error:', err);
                setError('Failed to load available hotels. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchHotels();
    }, [opened, hotel?.id, cityName]);

    useEffect(() => {
        setVisibleCount(10);
    }, [searchText, selectedStars, selectedDistances, selectedViews, sortBy, hotels.length]);

    if (!hotel) return null;

    // ── Filter helpers ──────────────────────────────────────────
    const toggleFilter = (setter, value) =>
        setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

    const getDistanceMeters = (item) => {
        // Prefer the real Google Distance Matrix value
        const googleDist = googleDistanceCache[item?.id];
        if (googleDist && !googleDist.loading && !googleDist.error && googleDist.distanceMeters != null) {
            return googleDist.distanceMeters;
        }
        // Fallback to metadata field
        const raw = item?.metadata?.distance_from_haram ?? item?.distance_from_haram;
        if (raw == null) return null;
        return typeof raw === 'string' ? parseFloat(raw) : raw;
    };

    const matchesDistance = (item) => {
        if (!selectedDistances.length) return true;
        const googleDist = googleDistanceCache[item?.id];
        // If Google data is still loading, treat as unspecified — skip filtering until ready
        if (googleDist?.loading) return !selectedDistances.includes('unspecified') ? true : false;
        const m = getDistanceMeters(item);
        return selectedDistances.some(range => {
            if (range === 'unspecified') return m == null;
            if (m == null) return false;
            if (range === '0-500') return m <= 500;
            if (range === '500-1000') return m > 500 && m <= 1000;
            if (range === '1000-2000') return m > 1000 && m <= 2000;
            if (range === '2000+') return m > 2000;
            return false;
        });
    };

    const matchesView = (item) => {
        if (!selectedViews.length) return true;
        const facilities = (hotelDetailsCache[item?.id]?.facilities || [])
            .map(f => (typeof f === 'string' ? f : f?.name || '').toLowerCase());
        return selectedViews.some(v => facilities.some(f => f.includes(v.toLowerCase())));
    };

    const filteredHotels = hotels.filter(item => {
        if (searchText && !item?.name?.toLowerCase().includes(searchText.toLowerCase())) return false;
        if (selectedStars.length) {
            const stars = Math.round(Number(item?.metadata?.stars));
            if (!selectedStars.includes(stars === 0 ? 'unrated' : stars)) return false;
        }
        if (!matchesDistance(item)) return false;
        if (!matchesView(item)) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'price_asc') return (a.metadata?.min_price ?? 0) - (b.metadata?.min_price ?? 0);
        if (sortBy === 'price_desc') return (b.metadata?.min_price ?? 0) - (a.metadata?.min_price ?? 0);
        return 0;
    });

    const visibleHotels = filteredHotels.slice(0, visibleCount);
    const hasMore = visibleCount < filteredHotels.length;

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + itemsPerPage, filteredHotels.length));
    };

    const confirmHotelStars = confirmHotel ? Math.round(Number(confirmHotel?.metadata?.stars)) : 0;
    const confirmDaysDiff = Math.max(daysDiff, 1);

    const activeFilterCount =
        (searchText ? 1 : 0) +
        selectedStars.length +
        selectedDistances.length +
        selectedViews.length +
        (sortBy !== 'default' ? 1 : 0);

    const clearAllFilters = () => {
        setSearchText('');
        setSelectedStars([]);
        setSelectedDistances([]);
        setSelectedViews([]);
        setSortBy('default');
    };

    const renderStars = (count, size = 12) => {
        const stars = Math.round(Number(count));
        if (!stars || isNaN(stars) || stars <= 0) return null;
        return Array(stars).fill(0).map((_, i) => <FaStar key={i} size={size} />);
    };

    const renderSearchInput = (wrapClass = '') => (
        <div className={`${styles.searchWrap} ${wrapClass}`}>
            {/* <FiSearch className={styles.searchIcon} size={15} /> */}
            <input
                type="text"
                className={styles.searchInput}
                placeholder="Search Hotels"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
            />
        </div>
    );

    const haramLabel = cityName === 'Madinah' ? 'Nabawi' : 'Haram';

    const renderFilterPanel = (idPrefix = '') => (
        <div className={styles.filterPanel}>
            <div>
                <p className={styles.filterSectionTitle}>Sort By</p>
                <div className={styles.pillGroup}>
                    {[
                        { value: 'default', label: 'Default' },
                        { value: 'price_asc', label: 'Price ↑' },
                        { value: 'price_desc', label: 'Price ↓' },
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            className={`${styles.sortPill} ${sortBy === value ? styles.sortPillActive : ''}`}
                            onClick={() => setSortBy(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className={styles.filterSectionTitle}>Property Rating</p>
                <div className={styles.filterOptions}>
                    {[5, 4, 3, 2, 1].map(star => (
                        <label key={star} className={styles.filterOption} htmlFor={`${idPrefix}star-${star}`}>
                            <input
                                type="checkbox"
                                id={`${idPrefix}star-${star}`}
                                checked={selectedStars.includes(star)}
                                onChange={() => toggleFilter(setSelectedStars, star)}
                            />
                            <span className={styles.starLabelRow} aria-label={`${star} stars`}>
                                {Array.from({ length: star }).map((_, i) => (
                                    <FaStar key={i} className={styles.starIcon} />
                                ))}
                            </span>
                        </label>
                    ))}
                    <label className={styles.filterOption} htmlFor={`${idPrefix}star-unrated`}>
                        <input
                            type="checkbox"
                            id={`${idPrefix}star-unrated`}
                            checked={selectedStars.includes('unrated')}
                            onChange={() => toggleFilter(setSelectedStars, 'unrated')}
                        />
                        <span className={styles.unratedLabel}>Unrated</span>
                    </label>
                </div>
            </div>

            <div>
                <p className={styles.filterSectionTitle}>Distance from {haramLabel}</p>
                <div className={styles.filterOptions}>
                    {[
                        { value: '0-500', label: `0–500m from ${haramLabel}` },
                        { value: '500-1000', label: `500m–1km from ${haramLabel}` },
                        { value: '1000-2000', label: `1–2km from ${haramLabel}` },
                        { value: '2000+', label: 'More than 2km' },
                        { value: 'unspecified', label: 'Distance not specified' },
                    ].map(({ value, label }) => (
                        <label key={value} className={styles.filterOption} htmlFor={`${idPrefix}dist-${value}`}>
                            <input
                                type="checkbox"
                                id={`${idPrefix}dist-${value}`}
                                checked={selectedDistances.includes(value)}
                                onChange={() => toggleFilter(setSelectedDistances, value)}
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {activeFilterCount > 0 && (
                <button type="button" className={styles.clearFiltersBtn} onClick={clearAllFilters}>
                    Clear All Filters
                </button>
            )}
        </div>
    );

    const renderHotelCard = (item, index) => {
        const detail = hotelDetailsCache[item?.id];
        const detailLoading = !detail || detail?.loading;
        const dist = googleDistanceCache[item?.id];

        return (
            <article key={item?.id || index} className={styles.hotelCard}>
                <div className={styles.hotelCardInner}>
                    <div className={styles.hotelImageWrap}>
                        {detailLoading ? (
                            <div className={styles.imageSkeleton} />
                        ) : detail?.images ? (
                            <Image
                                src={detail.images}
                                fill
                                className={styles.hotelImage}
                                alt={item.name}
                                unoptimized
                            />
                        ) : (
                            <div className={styles.imagePlaceholder}>No Image</div>
                        )}
                        {item?.provider === 'custom' && (
                            <span className={styles.alBadge}>AL Hijaz</span>
                        )}
                    </div>

                    <div className={styles.hotelBody}>
                        <div className={styles.hotelContent}>
                            <div className={styles.hotelInfo}>
                                <div className={styles.starsRow}>
                                    {item?.metadata?.stars && !isNaN(item.metadata.stars)
                                        ? renderStars(item.metadata.stars, 13)
                                        : <span className={styles.noRating}>No Rating</span>}
                                </div>

                                <h3 className={styles.hotelName}>{item.name}</h3>

                                {detailLoading ? (
                                    <p className={styles.hotelAddress}>
                                        <CiLocationOn size={14} />
                                        <span className={styles.addressSkeleton} />
                                    </p>
                                ) : detail?.address ? (
                                    <p className={styles.hotelAddress}>
                                        <CiLocationOn size={14} />
                                        <span>{detail.address}</span>
                                    </p>
                                ) : null}

                                {detailLoading ? (
                                    <div className={styles.facilitiesRow}>
                                        <span className={styles.facilitySkeleton} style={{ width: 80 }} />
                                        <span className={styles.facilitySkeleton} style={{ width: 90 }} />
                                    </div>
                                ) : detail?.facilities?.length > 0 ? (
                                    <div className={styles.facilitiesRow}>
                                        {detail.facilities.slice(0, 3).map((amenity, i) => (
                                            <span key={i} className={styles.facilityChip}>{amenity}</span>
                                        ))}
                                        {detail.facilities.length > 3 && (
                                            <span className={styles.facilityMore}>+{detail.facilities.length - 3} more</span>
                                        )}
                                    </div>
                                ) : null}

                                <div className={styles.distRow}>
                                    {dist?.loading ? (
                                        <>
                                            <span className={styles.distSkeleton} style={{ width: 130 }} />
                                            <span className={styles.distSkeleton} style={{ width: 90 }} />
                                        </>
                                    ) : dist && !dist.error ? (
                                        <>
                                            <Tooltip
                                                label={cityName === 'Madinah' ? 'Walking distance from Masjid Al-Nabawi' : 'Walking distance from Haram'}
                                                position="top"
                                                withArrow
                                                fz="xs"
                                            >
                                                <span className={styles.distBadge}>
                                                    <CiLocationOn size={12} />
                                                    {dist.distance} {cityName === 'Madinah' ? 'from Nabawi' : 'from Haram'}
                                                </span>
                                            </Tooltip>
                                            <Tooltip
                                                label={cityName === 'Madinah' ? 'Estimated walking time from Masjid Al-Nabawi' : 'Estimated walking time'}
                                                position="top"
                                                withArrow
                                                fz="xs"
                                            >
                                                <span className={styles.distBadge}>
                                                    <FaClock size={10} />
                                                    {dist.walking}
                                                </span>
                                            </Tooltip>
                                        </>
                                    ) : dist ? (
                                        <span className={styles.distBadge}>
                                            <CiLocationOn size={12} />
                                            Distance N/A
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <div className={styles.hotelAside}>
                                <div className={styles.priceGroup}>
                                    <div className={styles.priceBlock}>
                                        <div className={styles.priceNight}>
                                            <PriceDisplay price={item.metadata.min_price / confirmDaysDiff} currency={item?.metadata.currency} /> / Night
                                        </div>
                                        <div className={styles.priceNightSub}>VAT &amp; taxes included</div>
                                    </div>
                                    <div className={styles.priceBlock}>
                                        <div className={styles.priceTotal}>
                                            <PriceDisplay price={item.metadata.min_price} currency={item?.metadata.currency} />
                                        </div>
                                        <div className={styles.priceTotalSub}>Total for {hotel?.nights} {hotel?.nights === 1 ? 'night' : 'nights'}</div>
                                    </div>
                                </div>
                                <button type="button" className={styles.selectBtn} onClick={() => handleSelectClick(item)}>
                                    Select Hotel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        );
    };

    const ApplyPriceChanges = () => {
        // Find room & rate with minimum price from confirmHotel.rooms
        const rooms = confirmHotel?.rooms || [];
        let minPrice = Infinity;
        let minRoomIndex = 0;
        let minRateIndex = 0;
        rooms.forEach((room, rIdx) => {
            (room.rates || []).forEach((rate, tIdx) => {
                if (Number(rate.price) < minPrice) {
                    minPrice = Number(rate.price);
                    minRoomIndex = rIdx;
                    minRateIndex = tIdx;
                }
            });
        });
        const minRoom = rooms[minRoomIndex];
        const minRate = minRoom?.rates?.[minRateIndex];
        const totalPax = Number(pkg?.original_request?.adult) + Number(pkg?.original_request?.child) + Number(pkg?.original_request?.infant);
        const newHotelPrice = Number(convertedPrice ? convertedPrice : confirmHotel?.metadata?.min_price);

        // Compute per-unit conversion factor from the already-resolved convertedPrice
        const rawMinPrice = Number(confirmHotel?.metadata?.min_price);
        const conversionFactor = currencyMismatch && convertedPrice && rawMinPrice
            ? convertedPrice / rawMinPrice
            : currencyMismatch ? null : 1;

        // Annotate every rate with original_price / conversion_rate / price,
        // and mark only the selected room + rate with price_added_to_package / selected_for_package
        const annotatedRooms = rooms.map((room, rIdx) => ({
            ...room,
            ...(rIdx === minRoomIndex ? { price_added_to_package: true, selected_for_package: true } : {}),
            rates: (room.rates || []).map((rate, tIdx) => ({
                ...rate,
                original_price: rate.price ?? '',
                conversion_rate: conversionFactor != null ? conversionFactor : '',
                price: conversionFactor != null ? Number(rate.price) * conversionFactor : (rate.price ?? ''),
                ...(rIdx === minRoomIndex && tIdx === minRateIndex
                    ? { price_added_to_package: true, selected_for_package: true }
                    : {}),
            })),
        }));

        if (cityName === 'Makkah') {
            const oldHotelPrice = Number(pkg?.pricing?.makkah_hotel_price) || 0;
            pkg.makkah_hotel.first_image = [];
            pkg.makkah_hotel.id = confirmHotel?.id;
            pkg.makkah_hotel.images = [];
            pkg.makkah_hotel.location = confirmHotel?.location;
            pkg.makkah_hotel.name = confirmHotel?.name;
            pkg.makkah_hotel.provider = confirmHotel?.provider;
            pkg.makkah_hotel.provider_code = confirmHotel?.provider_code;
            pkg.makkah_hotel.rooms = annotatedRooms;
            pkg.makkah_hotel.star_rating = confirmHotel?.metadata?.stars;
            pkg.makkah_hotel.price = newHotelPrice;
            pkg.makkah_hotel.selected_rate_index = minRateIndex;
            pkg.makkah_hotel.selected_rate_key = minRate?.rate_key ?? '';
            if (confirmHotel?.provider !== 'custom') {
                pkg.makkah_hotel.haram_view = false;
                pkg.makkah_hotel.kaaba_view = false;
            } else {
                let haramView = false;
                let kaabaView = false;
                (confirmHotel?.rooms || []).forEach(room => {
                    (room.rates || []).forEach(rate => {
                        const view = (rate?.metadata?.view || '').toLowerCase();
                        if (view.includes('haram')) haramView = true;
                        if (view.includes('kab')) kaabaView = true;
                    });
                });
                pkg.makkah_hotel.haram_view = haramView;
                pkg.makkah_hotel.kaaba_view = kaabaView;
            }
            pkg.makkah_hotel.selected_room_id = minRoom?.id ?? '';
            pkg.makkah_hotel.selected_room_index = minRoomIndex;
            pkg.makkah_hotel.selected_room_name = minRoom?.name ?? '';
            pkg.makkah_hotel.selected_board_name = minRate?.board_name ?? '';
            pkg.pricing.makkah_hotel_price = newHotelPrice;
            pkg.pricing.total_price = Number(pkg.pricing.total_price) - oldHotelPrice + newHotelPrice;
        } else if (cityName === 'Madinah') {
            const oldHotelPrice = Number(pkg?.pricing?.madinah_hotel_price) || 0;
            pkg.madinah_hotel.first_image = [];
            pkg.madinah_hotel.id = confirmHotel?.id;
            pkg.madinah_hotel.images = [];
            pkg.madinah_hotel.location = confirmHotel?.location;
            pkg.madinah_hotel.name = confirmHotel?.name;
            pkg.madinah_hotel.provider = confirmHotel?.provider;
            pkg.madinah_hotel.provider_code = confirmHotel?.provider_code;
            pkg.madinah_hotel.rooms = annotatedRooms;
            pkg.madinah_hotel.star_rating = confirmHotel?.metadata?.stars;
            pkg.madinah_hotel.price = newHotelPrice;
            pkg.madinah_hotel.selected_rate_index = minRateIndex;
            pkg.madinah_hotel.selected_rate_key = minRate?.rate_key ?? '';
            pkg.madinah_hotel.selected_room_id = minRoom?.id ?? '';
            pkg.madinah_hotel.selected_room_index = minRoomIndex;
            pkg.madinah_hotel.selected_room_name = minRoom?.name ?? '';
            pkg.madinah_hotel.selected_board_name = minRate?.board_name ?? '';
            if (confirmHotel?.provider !== 'custom') {
                pkg.madinah_hotel.haram_view = false;
                pkg.madinah_hotel.kaaba_view = false;
            } else {
                let haramView = false;
                let kaabaView = false;
                (confirmHotel?.rooms || []).forEach(room => {
                    (room.rates || []).forEach(rate => {
                        const view = (rate?.metadata?.view || '').toLowerCase();
                        if (view.includes('haram')) haramView = true;
                        if (view.includes('kab')) kaabaView = true;
                    });
                });
                pkg.madinah_hotel.haram_view = haramView;
                pkg.madinah_hotel.kaaba_view = kaabaView;
            }
            pkg.pricing.madinah_hotel_price = newHotelPrice;
            pkg.pricing.total_price = Number(pkg.pricing.total_price) - oldHotelPrice + newHotelPrice;
        }

        if (totalPax > 0) {
            pkg.pricing.price_per_person = pkg.pricing.total_price / totalPax;
            pkg.price_per_person = pkg.pricing.price_per_person;
        }
        pkg.total_price = pkg.pricing.total_price;

        // Push new hotel details into the parent ListingCard's hotelDetailsCache
        if (onHotelCacheUpdate && confirmHotel?.id) {
            const detail = hotelDetailsCache[confirmHotel.id];
            onHotelCacheUpdate(confirmHotel.id, {
                loading: false,
                address: detail?.address || confirmHotel?.location?.address || '',
                all_images: detail?.all_images || [],
            });
        }

        setConfirmOpen(false);
        onClose();
    };

    const currentHotelName = cityName === 'Makkah' ? pkg?.makkah_hotel?.name : pkg?.madinah_hotel?.name;
    const currentHotelPrice = cityName === 'Makkah' ? pkg?.pricing?.makkah_hotel_price : pkg?.pricing?.madinah_hotel_price;
    const currentHotelStars = cityName === 'Makkah' ? pkg?.makkah_hotel?.star_rating : pkg?.madinah_hotel?.star_rating;

    return (
        <>
            <Modal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title={
                    <div className={styles.confirmHeader}>
                        <div className={styles.confirmIcon}><FiCheckCircle size={18} /></div>
                        <Text fw={700} size="lg">Confirm Hotel Selection</Text>
                    </div>
                }
                centered
                size="md"
                radius="lg"
                transitionProps={{ transition: 'pop', duration: 200 }}
                zIndex={300}
            >
                {confirmHotel && (
                    <Stack gap="md">
                        {ratesLoading && (
                            <Group justify="center" gap="xs">
                                <Loader size="xs" color="teal" />
                                <Text size="xs" c="dimmed">Fetching exchange rates…</Text>
                            </Group>
                        )}
                        {ratesError && !ratesLoading && (
                            <Alert icon={<MdErrorOutline size={14} />} color="red" variant="light" py="xs">
                                <Group justify="space-between" align="center" gap="xs">
                                    <Text size="xs" style={{ flex: 1 }}>{ratesError}</Text>
                                    <Button size="xs" variant="light" color="red" leftSection={<FiRefreshCw size={11} />} onClick={handleRetry}>Retry</Button>
                                </Group>
                            </Alert>
                        )}

                        <div className={`${styles.compareCard} ${styles.compareCurrent}`}>
                            <div className={styles.compareLabel} style={{ color: '#dc2626' }}>Current Hotel</div>
                            <div className={styles.compareName}>{currentHotelName}</div>
                            <div className={styles.compareMeta}>
                                {renderStars(currentHotelStars, 10)}
                                <span className={styles.nightsPill}><FaClock size={10} /> {hotel?.nights} {hotel?.nights === 1 ? 'night' : 'nights'}</span>
                                <span>{moment(hotel?.check_in).format('DD MMM')} → {moment(hotel?.check_out).format('DD MMM YYYY')}</span>
                            </div>
                            <div className={styles.compareRow}>
                                <span>Per night</span>
                                <strong><PriceDisplay price={currentHotelPrice / confirmDaysDiff} currency={pkg?.pricing?.currency} /></strong>
                            </div>
                            <div className={styles.compareRow}>
                                <span>Total</span>
                                <strong style={{ color: '#dc2626' }}><PriceDisplay price={currentHotelPrice} currency={pkg?.pricing?.currency} /></strong>
                            </div>
                        </div>

                        <div className={styles.compareVs}>vs</div>

                        <div className={`${styles.compareCard} ${styles.compareNew}`}>
                            <div className={styles.compareLabel} style={{ color: '#16a34a' }}>New Hotel</div>
                            <div className={styles.compareName}>{confirmHotel?.name}</div>
                            <div className={styles.compareMeta}>
                                {renderStars(confirmHotelStars, 10)}
                                <span className={styles.nightsPill}><FaClock size={10} /> {hotel?.nights} {hotel?.nights === 1 ? 'night' : 'nights'}</span>
                                <span>{moment(hotel?.check_in).format('DD MMM')} → {moment(hotel?.check_out).format('DD MMM YYYY')}</span>
                            </div>
                            <div className={styles.compareRow}>
                                <span>Per night</span>
                                <strong><PriceDisplay price={Number(confirmHotel?.metadata?.min_price) / confirmDaysDiff} currency={confirmHotel?.metadata?.currency} /></strong>
                            </div>
                            <div className={styles.compareRow}>
                                <span>Total</span>
                                <strong style={{ color: '#16a34a' }}><PriceDisplay price={Number(confirmHotel?.metadata?.min_price)} currency={confirmHotel?.metadata?.currency} /></strong>
                            </div>
                        </div>

                        <div className={styles.confirmActions}>
                            <button type="button" className={styles.cancelBtn} onClick={() => setConfirmOpen(false)}>Cancel</button>
                            <button
                                type="button"
                                className={styles.applyBtn}
                                disabled={ratesLoading || (currencyMismatch && (!!ratesError || convertedPrice === null))}
                                onClick={ApplyPriceChanges}
                            >
                                <FiCheckCircle size={15} /> Apply Changes
                            </button>
                        </div>
                    </Stack>
                )}
            </Modal>

            <Modal
                opened={opened}
                onClose={onClose}
                fullScreen
                withCloseButton={false}
                padding={0}
                radius={0}
                transitionProps={{ transition: 'fade', duration: 200 }}
                classNames={{
                    content: styles.modalContent,
                    body: styles.modalBody,
                }}
            >
                <div className={styles.modalShell}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <div>
                                <div className={styles.headerTitleRow}>
                                    <h2 className={styles.headerTitle}>Change Hotel</h2>
                                    <span className={styles.cityBadge}>{cityName?.toUpperCase()}</span>
                                </div>
                                <p className={styles.headerSub}>Find Better Accommodation in {cityName}</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Close">
                            <IoMdClose size={22} />
                        </button>
                    </div>

                    <div className={styles.currentBar}>
                        <div className={styles.currentBarInner}>
                            <div>
                                <div className={styles.currentLabel}>Currently Selected</div>
                                <div className={styles.currentName}>{currentHotelName}</div>
                            </div>
                            <div className={styles.currentMeta}>
                                <span className={styles.nightsPill}>
                                    <FaClock size={10} /> {hotel?.nights} {hotel?.nights === 1 ? 'night' : 'nights'}
                                </span>
                                <span>{moment(hotel?.check_in).format('DD MMM')} → {moment(hotel?.check_out).format('DD MMM YYYY')}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.toolbar} ${styles.toolbarMobile}`}>
                        {renderSearchInput()}
                        <button type="button" className={styles.filterBtn} onClick={() => setFilterDrawerOpen(true)}>
                            <FiSliders size={14} />
                            Filters
                            {activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>}
                        </button>
                    </div>

                    {activeFilterCount > 0 && (
                        <div className={`${styles.activeChips} ${styles.toolbarMobile}`}>
                            {sortBy !== 'default' && (
                                <span className={styles.chip} onClick={() => setSortBy('default')}>
                                    {sortBy === 'price_asc' ? 'Price ↑' : 'Price ↓'} ✕
                                </span>
                            )}
                            {selectedStars.map(s => (
                                <span key={s} className={styles.chip} onClick={() => toggleFilter(setSelectedStars, s)}>
                                    {s === 'unrated' ? 'Unrated' : `${s}★`} ✕
                                </span>
                            ))}
                            <button type="button" className={styles.chipClear} onClick={clearAllFilters}>Clear all</button>
                        </div>
                    )}

                    <div className={styles.pageContainer}>
                        <div className={styles.contentArea}>
                            <aside className={styles.filterSidebar}>
                                {renderFilterPanel('desktop-')}
                            </aside>

                            <main className={styles.resultsArea}>
                                {loading && (
                                    <div className={styles.stateBox}>
                                        <Loader size="md" color="#1B3B6F" />
                                        <p className={styles.stateText}>Searching for available hotels in {cityName}…</p>
                                    </div>
                                )}

                                {error && !loading && (
                                    <div className={styles.errorBox}>
                                        <MdErrorOutline size={20} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {!loading && !error && hotels.length === 0 && (
                                    <div className={styles.stateBox}>
                                        <HiOutlineBuildingOffice2 size={36} color="#9ca3af" />
                                        <p className={styles.stateText}>No alternative hotels found for {cityName}.</p>
                                    </div>
                                )}

                                {!loading && !error && hotels.length > 0 && (
                                    <>
                                        <div className={styles.resultsHeader}>
                                            <div>
                                                <div className={styles.resultsCount}>
                                                    Showing {filteredHotels.length} Hotel{filteredHotels.length !== 1 ? 's' : ''}
                                                </div>
                                                <div className={styles.resultsSub}>Alternative Hotels in {cityName}</div>
                                            </div>
                                            {renderSearchInput(styles.resultsSearch)}
                                        </div>

                                        {filteredHotels.length === 0 ? (
                                            <div className={styles.stateBox}>
                                                <p className={styles.stateText}>No hotels match your filters. Try adjusting them.</p>
                                                <button type="button" className={styles.clearFiltersBtn} style={{ width: 'auto', padding: '10px 24px' }} onClick={clearAllFilters}>
                                                    Clear Filters
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.hotelList}>
                                                {visibleHotels.map((item, index) => renderHotelCard(item, index))}
                                                <UmrahPagination hasMore={hasMore} onLoadMore={loadMore} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </main>
                        </div>
                    </div>
                </div>
            </Modal>

            <Drawer
                opened={filterDrawerOpen}
                onClose={() => setFilterDrawerOpen(false)}
                title={<Text fw={700} size="md">Filters &amp; Sort</Text>}
                position="bottom"
                size="88%"
                radius="lg"
                overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
                transitionProps={{ duration: 200 }}
                withinPortal
                lockScroll
                trapFocus={false}
                zIndex={400}
            >
                <div style={{ overflowY: 'auto', paddingBottom: 80 }}>
                    {renderFilterPanel('drawer-')}
                </div>
                <div className={styles.drawerFooter}>
                    {activeFilterCount > 0 && (
                        <button type="button" className={styles.drawerClearBtn} onClick={clearAllFilters}>
                            Clear All
                        </button>
                    )}
                    <button type="button" className={styles.drawerShowBtn} onClick={() => setFilterDrawerOpen(false)}>
                        Show {filteredHotels.length} {filteredHotels.length === 1 ? 'Hotel' : 'Hotels'}
                    </button>
                </div>
            </Drawer>
        </>
    );
}
