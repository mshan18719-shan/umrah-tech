'use client'
import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { MdTune, MdEdit, MdLocationOn, MdPeople } from "react-icons/md";
import FlightCard from '@/components/Flights/FlightCard';
import moment from 'moment';
// import SortOption from '@/components/Flights/Filters/SortOption';
import DepartureTimes from '@/components/Flights/Filters/DepartureTimes';
import JourneyDuration from '@/components/Flights/Filters/JourneyDuration';
import AirlineFilter from '@/components/Flights/Filters/AirlineFilter';
import FlightClass from '@/components/Flights/Filters/FlightClass';
import ResetFilter from '@/components/Flights/Filters/ResetFilter';
import LayoverTime from './Filters/Layovertime';
import Stops from '@/components/Flights/Filters/Stops';
import { useSearchParams } from 'next/navigation';
import FlightListingFullLoader from '@/components/Loader/FlightListingFullLoader';
import { FlightProvider, useFlightList } from '@/components/Flights/FlightListingContext';
import FlightListingPaginations from '@/components/Flights/FlightListingPaginations';
// import MapView from '@/components/Flights/MapView/MapView';
import ScrollList from '@/components/Flights/ScrollList/ScrollList';
import FlightSearch from '../Home/Search/FlightSearch';
import { LiaAngleDownSolid } from "react-icons/lia";
import { Drawer } from "@mantine/core";
import { PackageModeBanner } from '../Store/PackageModeHelper';
import { useHolidayPackageStore } from '../Store/HolidayPackageStore';
import GeneralPackages from '../Home/Search/GeneralPackages';
import heroStyles from './FlightListingHero.module.css';

function getFlightRouteLabel(searchParams) {
    const airTripType = searchParams.get('AirTripType');
    if (airTripType === 'MultiCity') {
        const parts = [];
        let index = 1;
        while (searchParams.get(`flight${index}_from`)) {
            const from = searchParams.get(`flight${index}_from`);
            const to = searchParams.get(`flight${index}_to`);
            if (from && to) parts.push(`${from} → ${to}`);
            index++;
        }
        if (parts.length) return parts.join(' · ');
        return 'Multi-city';
    }
    const from = searchParams.get('DepartureCode');
    const to = searchParams.get('ArrivalCode');
    if (from && to) return `${from} → ${to}`;
    return 'your route';
}

function FlightResultsTopBar({ searchParams }) {
    const { totalFlights, allFlights, sort, setSort, setCurrentPage } = useFlightList();
    const total = allFlights.length;
    const isFiltered = totalFlights !== total;
    const label = totalFlights === 1 ? 'Flight' : 'Flights';
    const routeLabel = getFlightRouteLabel(searchParams);

    if (totalFlights === 0) return null;

    const handleSortChange = (e) => {
        setSort(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="hotel-results-topbar flight-results-topbar" aria-live="polite">
            <div className="hotel-results-left">
                <p className="hotel-results-count mb-0">
                    {isFiltered ? (
                        <>
                            <strong>
                                {totalFlights} of {total} {label}
                            </strong>
                            <span className="hotel-results-subtext"> match your filters</span>
                        </>
                    ) : (
                        <>
                            <strong>
                                {totalFlights} {label}
                            </strong>
                            <span className="hotel-results-subtext"> found for your search</span>
                        </>
                    )}
                </p>
                <p className="hotel-results-caption mb-0">Showing {routeLabel} flights</p>
            </div>
            <select
                value={sort}
                onChange={handleSortChange}
                className="form-select hotel-results-sort"
                aria-label="Sort flights"
            >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Low to High</option>
                <option value="price-desc">High to Low</option>
                <option value="duration-asc">Fastest</option>
            </select>
        </div>
    );
}

function FilterDrawer({ opened, onClose, title, size, children }) {
    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            title={title}
            position="bottom"
            size={size}
            overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
            transitionProps={{ duration: 200 }}
            withinPortal
            lockScroll
            trapFocus={false}
            classNames={{ content: 'hotel-filter-drawer flight-filter-drawer' }}
        >
            <div className="mb-2" style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
            <ResetFilter setActiveDrawer={onClose} />
            <div className="border-top pt-3 mt-3">
                <button type="button" className="hotel-filter-done-btn" onClick={onClose}>
                    Done
                </button>
            </div>
        </Drawer>
    );
}

export default function FlightListingPage() {
    const { isActive, packageConfig } = useHolidayPackageStore();
    const searchParams = useSearchParams();
    const [activeDrawer, setActiveDrawer] = useState(null);
    const [flightList, setFlightList] = useState([]);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [packageSearch, setPackageSearch] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isFilterStuck, setIsFilterStuck] = useState(false);
    const [isTallSearch, setIsTallSearch] = useState(
        () => searchParams.get('AirTripType') === 'MultiCity'
    );
    const filterSentinelRef = useRef(null);
    const searchPanelRef = useRef(null);
    const heroSectionRef = useRef(null);
    const isMultiCity = searchParams.get('AirTripType') === 'MultiCity';

    // Keep search half-on-image; for tall/multi-city grow hero height + bottom
    // margin with the form so it never covers navbar or results.
    useEffect(() => {
        const panel = searchPanelRef.current;
        const section = heroSectionRef.current;
        if (!panel || typeof ResizeObserver === 'undefined') return undefined;

        const syncTallSearch = () => {
            const height = panel.getBoundingClientRect().height || 0;
            const tall = isMultiCity || height > 220;
            setIsTallSearch(tall);

            if (!section) return;

            if (tall && height > 0) {
                const overhang = Math.ceil(height * 0.48) + 28;
                const imageHeight = Math.max(300, Math.ceil(height * 0.58 + 160));
                section.style.setProperty('--hero-image-height', `${imageHeight}px`);
                section.style.setProperty('--hero-margin-bottom', `${overhang}px`);
            } else {
                section.style.removeProperty('--hero-image-height');
                section.style.removeProperty('--hero-margin-bottom');
            }
        };

        const rafId = requestAnimationFrame(syncTallSearch);
        const observer = new ResizeObserver(syncTallSearch);
        observer.observe(panel);
        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [packageSearch, isMultiCity, searchParams]);

    useEffect(() => {
        async function getFlights() {
            setIsLoading(true);
            const airTripType = searchParams.get('AirTripType');
            const isPackageMode = searchParams.get("packageMode");
            const isEditMode = searchParams.get("edit");
            if(!isPackageMode || !isEditMode){
                setPackageSearch(true);
            }
            // Build legs array for all flight types
            const legs = [];

            if (airTripType === 'MultiCity') {
                // Build multi-city request with legs array
                let index = 1;
                while (searchParams.get(`flight${index}_from`)) {
                    legs.push({
                        origin: searchParams.get(`flight${index}_from`),
                        destination: searchParams.get(`flight${index}_to`),
                        departure_date: searchParams.get(`flight${index}_date`)
                    });
                    index++;
                }
            } else if (airTripType === 'Return') {
                // Return trip - 2 legs
                legs.push({
                    origin: searchParams.get('DepartureCode'),
                    destination: searchParams.get('ArrivalCode'),
                    departure_date: searchParams.get('DepartureDate')
                });
                legs.push({
                    origin: searchParams.get('ArrivalCode'),
                    destination: searchParams.get('DepartureCode'),
                    departure_date: searchParams.get('ReturnDate')
                });
            } else {
                // One-way trip - 1 leg
                legs.push({
                    origin: searchParams.get('DepartureCode'),
                    destination: searchParams.get('ArrivalCode'),
                    departure_date: searchParams.get('DepartureDate')
                });
            }

            // Unified params for all flight types
            const params = {
                "legs": legs,
                "adult": Number(searchParams.get('adult')) || 1,
                "child": Number(searchParams.get('child')) || 0,
                "infant": Number(searchParams.get('infant')) || 0,
                "CabinType": searchParams.get('CabinType') || "Y",
                "MaxStopsQuantity": "All",
                "PricingSourceType": "All",
                "IsRefundable": false,
                "RequestOptions": "fifty",
                "NearByAirports": false,
                "AirTripType": airTripType,
                "Target": "Test",
                "ConversationId": "395923377895446"
            };
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/search`,
                    {
                        method: 'POST',
                        // cache: 'no-store',
                        headers: {
                            'Content-Type': 'application/json',
                            // 'ngrok-skip-browser-warning': '69420',
                        },
                        body: JSON.stringify(params)
                    });
                const response = await res.json();
                setIsLoading(false)
                // console.log("Flight search response:", response);
                if (response.success) {
                    // Ensure each offer carries trip type + legs so listing/cards can split multicity
                    const normalizedTripType =
                        airTripType === 'MultiCity'
                            ? 'multicity'
                            : airTripType === 'Return'
                                ? 'return'
                                : 'oneway';
                    const flights = (response?.data?.flights || []).map((flight) => ({
                        ...flight,
                        trip_type:
                            airTripType === 'MultiCity'
                                ? 'multicity'
                                : airTripType === 'Return'
                                    ? (flight.trip_type || 'return')
                                    : (flight.trip_type || normalizedTripType),
                        tag: flight.tag ?? flight.fare_tag ?? '',
                        search_criteria: {
                            ...(flight.search_criteria || {}),
                            AirTripType: flight.search_criteria?.AirTripType || airTripType,
                            adult: Number(flight.search_criteria?.adult ?? params.adult) || 1,
                            child: Number(flight.search_criteria?.child ?? params.child) || 0,
                            infant: Number(flight.search_criteria?.infant ?? params.infant) || 0,
                            legs:
                                (flight.search_criteria?.legs?.length
                                    ? flight.search_criteria.legs
                                    : legs),
                        },
                    }));
                    setFlightList(flights);
                }
            } catch (error) {
                setIsLoading(false)
                console.log(error)
            }
        }
        getFlights();
    }, [searchParams]);

    useEffect(() => {
        const sentinel = filterSentinelRef.current;
        if (!sentinel || isLoading) return;

        let ticking = false;
        const updateStuck = () => {
            setIsFilterStuck(sentinel.getBoundingClientRect().bottom <= 0);
            ticking = false;
        };
        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateStuck);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        updateStuck();
        return () => window.removeEventListener('scroll', onScroll);
    }, [isLoading]);
    return (
        <div className={`flight-listing-page${(isTallSearch || isMultiCity) ? ' flight-listing-page--tall-search' : ''}`}>
            <PackageModeBanner serviceName="flight" />
            <FlightProvider flights={flightList} infiniteScroll>
                {/* Desktop: hero image + overlapping search */}
                <div
                    ref={heroSectionRef}
                    className={`${heroStyles.heroSection} ${(isTallSearch || isMultiCity) ? heroStyles.heroSectionTall : ''} d-none d-md-block`}
                >
                    <div className={heroStyles.heroImageWrap}>
                        <Image
                            src="/images/flight.jpg"
                            alt="Flight search"
                            fill
                            priority
                            sizes="100vw"
                            className={heroStyles.heroImage}
                            quality={75}
                        />
                        <div className={heroStyles.heroOverlay} aria-hidden="true" />
                    </div>
                    <div ref={searchPanelRef} className={heroStyles.searchPanel}>
                        <div className="container">
                            <div className={heroStyles.searchCard}>
                                {!packageSearch ? (
                                    <GeneralPackages packageConfig={packageConfig} isActive={isActive} />
                                ) : (
                                    <FlightSearch variant="listing" />
                                )}
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
                            <div className='msb-icon'>
                                <MdLocationOn size={20} color="#02245E" />
                            </div>
                            <div className='flex-grow-1' style={{ minWidth: 0 }}>
                                <div className='msb-title'>
                                    {searchParams.get('DepartureCode') || 'Search'}
                                    {searchParams.get('ArrivalCode') && (
                                        <span className='msb-title-secondary'> → {searchParams.get('ArrivalCode')}</span>
                                    )}
                                </div>
                                <div className='msb-subtitle'>
                                    {(() => {
                                        const tripType = searchParams.get('AirTripType');
                                        const label = tripType === 'Return' ? 'Return' : tripType === 'MultiCity' ? 'Multi-City' : 'One Way';
                                        return <span className='msb-subtitle-date' style={{ marginLeft: 0, marginRight: 6 }}>{label} ·</span>;
                                    })()}
                                    <MdPeople size={12} className='msb-subtitle-icon' />
                                    {(() => {
                                        const adults = Number(searchParams.get('adult')) || 0;
                                        const children = Number(searchParams.get('child')) || 0;
                                        const infants = Number(searchParams.get('infant')) || 0;
                                        const parts = [];
                                        if (adults) parts.push(`${adults} Adult${adults !== 1 ? 's' : ''}`);
                                        if (children) parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);
                                        if (infants) parts.push(`${infants} Infant${infants !== 1 ? 's' : ''}`);
                                        return parts.length ? parts.join(', ') : 'Tap to search';
                                    })()}
                                    {searchParams.get('DepartureDate') && (
                                        <span className='msb-subtitle-date'>· {moment(searchParams.get('DepartureDate')).format('DD MMM YYYY')}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); setShowMobileSearch(prev => !prev); }}
                                className='msb-modify-btn'
                            >
                                <MdEdit size={13} />
                                Modify
                            </button>
                        </div>
                    </div>
                    <div
                        className='msb-collapse'
                        style={{ maxHeight: showMobileSearch ? '900px' : '0' }}
                    >
                        <div className='msb-collapse-inner'>
                            {!packageSearch ? (
                                <GeneralPackages packageConfig={packageConfig} isActive={isActive} />
                            ) : (
                                <FlightSearch onSearch={() => setShowMobileSearch(false)} />
                            )}
                        </div>
                    </div>
                </div>
                {isLoading ? (
                    <div>
                        <FlightListingFullLoader />
                    </div>
                ) : (
                    <div className='container mb-5 flight-listing-results'>
                        <div ref={filterSentinelRef} className="filter-scroll-sentinel d-md-none" aria-hidden="true" />
                        <div className={`filter-scroll d-flex gap-2 d-md-none mb-3${isFilterStuck ? ' filter-scroll--stuck' : ''}`}>
                            <button onClick={() => setActiveDrawer('stops')} className="filter-pill">
                                Stops <span className="arrow"><LiaAngleDownSolid /></span>
                            </button>

                            <button onClick={() => setActiveDrawer('departureTimes')} className="filter-pill">
                                Flight Times <span className="arrow"><LiaAngleDownSolid /></span>
                            </button>

                            <button onClick={() => setActiveDrawer('duration')} className="filter-pill">
                                Duration <span className="arrow"><LiaAngleDownSolid /></span>
                            </button>

                            <button onClick={() => setActiveDrawer('airlines')} className="filter-pill">
                                Airlines <span className="arrow"><LiaAngleDownSolid /></span>
                            </button>
                            <button onClick={() => setActiveDrawer('layover')} className="filter-pill">
                                Layover Time <span className="arrow"><LiaAngleDownSolid /></span>
                            </button>
                            {/* <button onClick={() => setActiveDrawer('flightType')} className="filter-pill">
                                Cabin <span className="arrow"><LiaAngleDownSolid /></span>
                            </button> */}
                        </div>
                        <FlightResultsTopBar searchParams={searchParams} />
                        <div className='row'>
                            {/* <div className='col-12 mb-4 d-none d-md-block'>
                                <ScrollList flightList={flightList} />
                            </div> */}
                            <div className='col-md-3 col-sm-12 col-12'>
                                <div className="hotel-filter-sidebar d-none d-md-flex">
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
                                        <Stops />
                                    </div>
                                    <div className="hotel-filter-panel">
                                        <DepartureTimes />
                                    </div>
                                    <div className="hotel-filter-panel">
                                        <JourneyDuration />
                                    </div>
                                    <div className="hotel-filter-panel">
                                        <AirlineFilter />
                                    </div>
                                    <div className="hotel-filter-panel">
                                        <LayoverTime />
                                    </div>
                                    {/* <div className="hotel-filter-panel">
                                        <FlightClass />
                                    </div> */}
                                </div>

                                <FilterDrawer
                                    opened={activeDrawer === 'stops'}
                                    onClose={() => setActiveDrawer(null)}
                                    title="Stops"
                                    size="37%"
                                >
                                    <Stops />
                                </FilterDrawer>
                                <FilterDrawer
                                    opened={activeDrawer === 'departureTimes'}
                                    onClose={() => setActiveDrawer(null)}
                                    title="Flight Times"
                                    size="65%"
                                >
                                    <DepartureTimes />
                                </FilterDrawer>
                                <FilterDrawer
                                    opened={activeDrawer === 'duration'}
                                    onClose={() => setActiveDrawer(null)}
                                    title="Journey Duration"
                                    size="35%"
                                >
                                    <JourneyDuration />
                                </FilterDrawer>
                                <FilterDrawer
                                    opened={activeDrawer === 'airlines'}
                                    onClose={() => setActiveDrawer(null)}
                                    title="Airlines"
                                    size="100%"
                                >
                                    <AirlineFilter />
                                </FilterDrawer>
                                <FilterDrawer
                                    opened={activeDrawer === 'layover'}
                                    onClose={() => setActiveDrawer(null)}
                                    title="Layover Time"
                                    size="30%"
                                >
                                    <LayoverTime />
                                </FilterDrawer>
                                <FilterDrawer
                                    opened={activeDrawer === 'flightType'}
                                    onClose={() => setActiveDrawer(null)}
                                    title="Cabin"
                                    size="35%"
                                >
                                    <FlightClass />
                                </FilterDrawer>
                            </div>
                            <div className='col-md-9 col-sm-12 col-12'>
                                <FlightCard />
                                <FlightListingPaginations />
                            </div>
                        </div>
                    </div>
                )}
            </FlightProvider>
        </div>
    )
}
