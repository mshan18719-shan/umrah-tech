'use client'
import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import { MdTune, MdEdit, MdLocationOn, MdPeople } from "react-icons/md";
import SearchBar from '@/components/Hotels/HotelListing/Filters/SearchBar';
import HotelCard from '@/components/Hotels/HotelListing/HotelCard';
import PriceRange from '@/components/Hotels/HotelListing/Filters/PriceRange';
import SortOption from '@/components/Hotels/HotelListing/Filters/SortOption';
import StarFilter from '@/components/Hotels/HotelListing/Filters/StarFilter';
import MealType from '@/components/Hotels/HotelListing/Filters/MealType';
import DistanceFilter from '@/components/Hotels/HotelListing/Filters/DistanceFilter';
import ResetFilter from "@/components/Hotels/HotelListing/Filters/ResetFilter";
import { HotelListProvider, useHotelList } from '@/components/Hotels/HotelListing/HotelListingContext';
import HotelListingPaginations from '@/components/Hotels/HotelListing/HotelListingPaginations';
import HotelMap, { HotelMapMobileTrigger } from '@/components/Hotels/HotelListing/HotelMap';
import { useSearchParams } from "next/navigation";
import HotelCardLoader from "@/components/Loader/HotelCardLoader";
import HotelModify from "@/components/Home/Search/ModifySearch/HotelModify";
import { LiaAngleDownSolid } from "react-icons/lia";
import { Drawer } from "@mantine/core";
import moment from "moment";
import heroStyles from '@/components/Hotels/HotelListingHero.module.css';
import { streamHotelSearch, MIN_HOTELS_BEFORE_LISTING } from '@/util/streamHotelSearch';

function HotelResultsTopBar({ isLoading, city, place, onOpenMap, showMapButton }) {
    const { totalHotels, sort, setSort } = useHotelList();

    if (isLoading || totalHotels === 0) return null;

    const displayPlace = place || city || 'Hotels';

    return (
        <div className="hotel-results-topbar">
            <div className="hotel-results-left">
                <p className="hotel-results-count mb-0">
                    <strong>{totalHotels} {totalHotels > 1 ? 'Hotels' : 'Hotel'}</strong>
                    <span className="hotel-results-subtext"> found for your search</span>
                </p>
                <p className="hotel-results-caption mb-0">Showing {displayPlace} hotels</p>
            </div>
            <div className="hotel-results-actions d-flex align-items-center gap-2 flex-wrap justify-content-end">
               
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="form-select hotel-results-sort"
                    aria-label="Sort hotels"
                >
                    <option value="recommended">Recommended</option>
                    <option value="price-asc">Low to High</option>
                    <option value="price-desc">High to Low</option>
                    <option value="name-asc">Name: A-Z</option>
                </select>
            </div>
        </div>
    );
}

function DistanceFilterPill({ setActiveDrawer }) {
    const { landmark } = useHotelList();
    if (!landmark) return null;
    return (
        <button onClick={() => setActiveDrawer('distance')} className="filter-pill">
            Distance <span className="arrow"><LiaAngleDownSolid /></span>
        </button>
    );
}

function DistanceFilterPanel() {
    const { landmark } = useHotelList();
    if (!landmark) return null;
    return (
        <div className="hotel-filter-panel">
            <DistanceFilter />
        </div>
    );
}

function DistanceFilterDrawer({ activeDrawer, setActiveDrawer }) {
    const { landmark } = useHotelList();
    if (!landmark) return null;
    return (
        <Drawer
            opened={activeDrawer === 'distance'}
            onClose={() => setActiveDrawer(null)}
            title={landmark.filterTitle}
            position="bottom"
            size="55%"
            overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
            classNames={{ content: 'hotel-filter-drawer' }}
        >
            <div className="mb-2">
                <DistanceFilter />
            </div>
            <ResetFilter setActiveDrawer={setActiveDrawer} />
            <div className="border-top pt-3 mt-3">
                <button
                    type="button"
                    className="hotel-filter-done-btn"
                    onClick={() => setActiveDrawer(null)}
                >
                    Done
                </button>
            </div>
        </Drawer>
    );
}

export default function Page() {
    const [progress, setProgress] = useState(0);
    const [isDesktop, setIsDesktop] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [hotelsList, setHotelsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isStreaming, setIsStreaming] = useState(false);
    const hotelMapRef = useRef(null);
    const searchParams = useSearchParams();
    const city = searchParams.get("city");
    const countryCode = searchParams.get("code");
    const currency = searchParams.get("currency");
    const check_in = searchParams.get("checkIn");
    const check_out = searchParams.get("checkOut");
    const clientNationality = searchParams.get("nationality");
    const lat = searchParams.get("lat");
    const long = searchParams.get("lng");
    const location = searchParams.get("location");
    const country = searchParams.get("country");
    const place = searchParams.get("place");

    const rooms = useMemo(() => {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem('searchRoomSelection') || '[]') || [];
        } catch {
            return [];
        }
    }, [city, check_in, check_out, lat, long]);

    const totalAdults = rooms.reduce((acc, room) => acc + (room.adults || 0), 0);
    const totalChildren = rooms.reduce((acc, room) => acc + (room.children?.length || 0), 0);

    // Stream hotel search: hold UI until ≥15 hotels, then append as providers arrive.
    // If the stream ends with fewer than 15, show whatever was returned.
    useEffect(() => {
        if (!city || !check_in || !check_out) {
            setHotelsList([]);
            setIsLoading(false);
            setIsStreaming(false);
            return undefined;
        }

        const abort = new AbortController();
        let cancelled = false;
        let hasShownListing = false;

        const searchData = {
            city,
            countryCode,
            currency,
            check_in,
            check_out,
            lat,
            long,
            location,
            country,
            clientNationality,
        };
        localStorage.setItem('HotelSearchData', JSON.stringify(searchData));

        const request = {
            checkIn: check_in,
            checkOut: check_out,
            destination: {
                city,
                latitude: lat,
                longitude: long,
                countryCode,
                clientNationality,
            },
            currency,
            rooms,
        };

        setHotelsList([]);
        setIsLoading(true);
        setIsStreaming(true);
        setProgress(0);

        (async () => {
            try {
                await streamHotelSearch({
                    request,
                    signal: abort.signal,
                    minHotelsBeforeEmit: MIN_HOTELS_BEFORE_LISTING,
                    onProvider: ({ allHotels }) => {
                        if (cancelled) return;
                        setHotelsList(Array.isArray(allHotels) ? allHotels : []);
                        if (!hasShownListing) {
                            hasShownListing = true;
                            setIsLoading(false);
                        }
                    },
                    onDone: () => {
                        if (cancelled) return;
                        setIsLoading(false);
                        setIsStreaming(false);
                        setProgress(100);
                    },
                });
                if (!cancelled) {
                    setIsLoading(false);
                    setIsStreaming(false);
                    setProgress(100);
                }
            } catch (err) {
                if (cancelled || abort.signal.aborted) return;
                console.error('Hotel search stream failed:', err);
                setIsLoading(false);
                setIsStreaming(false);
                setProgress(100);
            }
        })();

        return () => {
            cancelled = true;
            abort.abort();
        };
    }, [
        city,
        countryCode,
        currency,
        check_in,
        check_out,
        clientNationality,
        lat,
        long,
        location,
        country,
        rooms,
    ]);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        if (isLoading || isStreaming) {
            setProgress((prev) => (prev < 10 ? 10 : prev));
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (isLoading) return prev < 85 ? prev + 5 : prev;
                    if (isStreaming) return prev < 95 ? prev + 2 : prev;
                    return 100;
                });
            }, 500);
            return () => clearInterval(interval);
        }
        setProgress(100);
        return undefined;
    }, [isLoading, isStreaming]);
    
    return (
        <div className="hotel-listing-page">
            <HotelListProvider hotels={hotelsList} place={place} city={city} location={location}>
                {/* Desktop: hero image + overlapping search */}
                <div className={`${heroStyles.heroSection} d-none d-md-block`}>
                    <div className={heroStyles.heroImageWrap}>
                        <Image
                            src="/images/hotels.jpg"
                            alt="Hotel search"
                            fill
                            priority
                            sizes="100vw"
                            className={heroStyles.heroImage}
                            quality={75}
                        />
                        <div className={heroStyles.heroOverlay} aria-hidden="true" />
                        <div className={`container ${heroStyles.heroTitleWrap}`}>
                            <h1 className={heroStyles.heroTitle}>Hotels</h1>
                        </div>
                    </div>
                    <div className={heroStyles.searchPanel}>
                        <div className="container">
                            <div className={heroStyles.searchCard}>
                                <HotelModify />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile: compact summary + collapsible search */}
                <div className='d-block d-md-none'>
                    <div className='msb-bar'>
                        <div
                            className='d-flex align-items-center gap-3 cursor-pointer'
                            onClick={() => setShowMobileSearch(prev => !prev)}
                        >
                            {/* Icon */}
                            <div className='msb-icon'>
                                <MdLocationOn size={20} color="#02245E" />
                            </div>

                            {/* Info */}
                            <div className='flex-grow-1' style={{ minWidth: 0 }}>
                                <div className='msb-title'>
                                    {location || city || 'Search Hotels'}
                                </div>
                                <div className='msb-subtitle'>
                                    <MdPeople size={12} className='msb-subtitle-icon' />
                                    {totalAdults > 0
                                        ? `${totalAdults} Adult${totalAdults !== 1 ? 's' : ''}${totalChildren > 0 ? `, ${totalChildren} Child${totalChildren !== 1 ? 'ren' : ''}` : ''}`
                                        : 'Tap to search'}
                                    {check_in && check_out && (
                                        <span className='msb-subtitle-date'>· {moment(check_in).format('DD-MM-YYYY')} → {moment(check_out).format('DD-MM-YYYY')}</span>
                                    )}
                                </div>
                            </div>

                            {/* Modify button */}
                            <button
                                onClick={e => { e.stopPropagation(); setShowMobileSearch(prev => !prev); }}
                                className='msb-modify-btn'
                            >
                                <MdEdit size={13} />
                                Modify
                            </button>
                        </div>
                    </div>

                    {/* Smooth collapsible search panel */}
                    <div
                        className='msb-collapse'
                        style={{ maxHeight: showMobileSearch ? '900px' : '0' }}
                    >
                        <div className='msb-collapse-inner'>
                            <HotelModify onSearch={() => setShowMobileSearch(false)} />
                        </div>
                    </div>
                </div>

                <div className='container mb-5 hotel-listing-results'>
                    <HotelResultsTopBar
                        isLoading={isLoading}
                        city={city}
                        place={place}
                        showMapButton={!isLoading && hotelsList?.length > 0 && !!lat && !!long}
                        onOpenMap={() => hotelMapRef.current?.openMap?.()}
                    />
                    {!isLoading && hotelsList?.length > 0 && lat && long && (
                        <HotelMap
                            ref={hotelMapRef}
                            hotels={hotelsList}
                            lat={Number(lat)}
                            long={Number(long)}
                            location={location || place || city}
                            showPreview
                        />
                    )}
                    <div className='row'>
                        <div className='col-md-3 col-sm-12 col-12'>
                            {/* Mobile: Filter Pills */}
                            <div className="filter-scroll d-flex gap-2 d-md-none mb-1 align-items-center">
                                {!isLoading && hotelsList?.length > 0 && lat && long && (
                                    <HotelMapMobileTrigger
                                        onClick={() => hotelMapRef.current?.openMap?.()}
                                    />
                                )}
                                <button onClick={() => setActiveDrawer('name')} className="filter-pill">
                                    Name <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <button onClick={() => setActiveDrawer('sort')} className="filter-pill">
                                    Sort By <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <button onClick={() => setActiveDrawer('price')} className="filter-pill">
                                    Price <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <button onClick={() => setActiveDrawer('rating')} className="filter-pill">
                                    Rating <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <button onClick={() => setActiveDrawer('meal')} className="filter-pill">
                                    Meal Type <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <DistanceFilterPill setActiveDrawer={setActiveDrawer} />
                            </div>

                            {/* Desktop: Sidebar Filters */}
                            <div className='hotel-filter-sidebar d-none d-md-flex'>
                                <div className="hotel-filter-panel-header">
                                    <div className="hotel-filter-sidebar__header">
                                        <div className="hotel-filter-sidebar__header-left">
                                            <MdTune className="hotel-filter-sidebar__icon" size={20} aria-hidden="true" />
                                            <p className="hotel-filter-sidebar__title">Filters</p>
                                        </div>
                                        <ResetFilter setActiveDrawer={setActiveDrawer} variant="link" />
                                    </div>
                                </div>
                                <div className="hotel-filter-panel">
                                    <SearchBar />
                                </div>
                                <div className="hotel-filter-panel">
                                    <PriceRange />
                                </div>
                                <div className="hotel-filter-panel">
                                    <StarFilter />
                                </div>
                                <div className="hotel-filter-panel">
                                    <MealType />
                                </div>
                                <DistanceFilterPanel />
                            </div>

                            {/* Mobile: Individual Filter Drawers */}
                            <Drawer
                                opened={activeDrawer === 'name'}
                                onClose={() => setActiveDrawer(null)}
                                title="Search By Name"
                                position="bottom"
                                size="40%"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                transitionProps={{ duration: 200 }}
                                withinPortal={true}
                                lockScroll={true}
                                trapFocus={false}
                                classNames={{ content: 'hotel-filter-drawer' }}
                            >
                                <div className="mb-2" style={{ position: 'relative', zIndex: 1 }}>
                                    <SearchBar />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} />
                                <div className="border-top pt-3 mt-3">
                                    <button
                                        type="button"
                                        className="hotel-filter-done-btn"
                                        onClick={() => setActiveDrawer(null)}
                                    >
                                        Done
                                    </button>
                                </div>
                            </Drawer>

                            <Drawer
                                opened={activeDrawer === 'sort'}
                                onClose={() => setActiveDrawer(null)}
                                title="Order By"
                                position="bottom"
                                size="35%"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                classNames={{ content: 'hotel-filter-drawer' }}
                            >
                                <div className="mb-2">
                                    <SortOption />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} />
                                <div className="border-top pt-3 mt-3">
                                    <button
                                        type="button"
                                        className="hotel-filter-done-btn"
                                        onClick={() => setActiveDrawer(null)}
                                    >
                                        Done
                                    </button>
                                </div>
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
                                <div className="mb-2">
                                    <PriceRange />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} />
                                <div className="border-top pt-3 mt-3">
                                    <button
                                        type="button"
                                        className="hotel-filter-done-btn"
                                        onClick={() => setActiveDrawer(null)}
                                    >
                                        Done
                                    </button>
                                </div>
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
                                <div className="mb-2">
                                    <StarFilter />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} />
                                <div className="border-top pt-3 mt-3">
                                    <button
                                        type="button"
                                        className="hotel-filter-done-btn"
                                        onClick={() => setActiveDrawer(null)}
                                    >
                                        Done
                                    </button>
                                </div>
                            </Drawer>

                            <Drawer
                                opened={activeDrawer === 'meal'}
                                onClose={() => setActiveDrawer(null)}
                                title="Meal Type"
                                position="bottom"
                                size="55%"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                classNames={{ content: 'hotel-filter-drawer' }}
                            >
                                <div className="mb-2">
                                    <MealType />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} />
                                <div className="border-top pt-3 mt-3">
                                    <button
                                        type="button"
                                        className="hotel-filter-done-btn"
                                        onClick={() => setActiveDrawer(null)}
                                    >
                                        Done
                                    </button>
                                </div>
                            </Drawer>

                            <DistanceFilterDrawer
                                activeDrawer={activeDrawer}
                                setActiveDrawer={setActiveDrawer}
                            />
                        </div>
                        <div className='col-md-9 col-sm-12 col-12'>
                            {(isLoading || isStreaming) && (
                                <div className="hotel-search-loader mb-3">
                                    <div className="hotel-search-loader__header">
                                        <div className="hotel-search-loader__spinner" role="status" aria-label="Loading">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="hotel-search-loader__text">
                                            <p className="hotel-search-loader__title">
                                                {isLoading ? 'Searching Hotels' : 'Loading more hotels'}
                                            </p>
                                            <p className="hotel-search-loader__subtitle">
                                                {isLoading
                                                    ? 'Finding the best stays for you…'
                                                    : 'More providers are still loading…'}
                                            </p>
                                        </div>
                                        <span className="hotel-search-loader__percent">{progress}%</span>
                                    </div>
                                    <div className="hotel-search-loader__track">
                                        <div
                                            className="hotel-search-loader__bar"
                                            role="progressbar"
                                            aria-valuenow={progress}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {isLoading && <HotelCardLoader />}
                            <HotelCard isLoading={isLoading} />
                            <HotelListingPaginations />
                        </div>
                    </div>
                </div>
            </HotelListProvider>
        </div>
    )
}
