'use client';
import React, { useEffect, useState } from 'react'
import { IoAirplaneOutline, IoArrowForwardCircleOutline } from 'react-icons/io5';
import { MdFilterListAlt, MdOutlineChangeCircle } from 'react-icons/md';
import { Drawer } from '@mantine/core';
import { useUmrahPackage } from '@/contexts/UmrahPackageContext';
import { FlightProvider } from '@/components/Flights/FlightListingContext';
import DepartureTimes from '@/components/Flights/Filters/DepartureTimes';
import JourneyDuration from '@/components/Flights/Filters/JourneyDuration';
import AirlineFilter from '@/components/Flights/Filters/AirlineFilter';
import FlightClass from '@/components/Flights/Filters/FlightClass';
import Stops from '@/components/Flights/Filters/Stops';
import PackageFlightCard from './PackageFlightCard';
import PackageFilterLoader from '@/components/Loader/PackageFilterLoader';
import { FaPlane } from 'react-icons/fa';
import style from './CustomizeFlight.module.css';

export default function CustomizeFlight({ originalFlight, onNext }) {
    const { packageData } = useUmrahPackage();
    const [isLoading, setIsLoading] = useState(true);
    const [flightList, setFlightList] = useState([]);
    // Track selected return airport - default based on journey type
    const [returnAirport, setReturnAirport] = useState(
        packageData?.details_request_info?.journey_type === 'makkahFirst' ? 'MED' : 'JED'
    );
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

    useEffect(() => {
        async function getFlights() {
            if (!packageData?.details_request_info) return;

            setIsLoading(true);
            const params = {
                "legs": [
                    {
                        "origin": packageData?.details_request_info?.departure_city,
                        "destination": packageData?.details_request_info?.journey_type === 'makkahFirst' ? 'JED' : 'MED',
                        "departure_date": packageData?.details_request_info?.departure_date
                    },
                    {
                        "origin": returnAirport, // Use selected return airport
                        "destination": packageData?.details_request_info?.departure_city,
                        "departure_date": packageData?.details_request_info?.journey_type === 'makkahFirst' ? packageData?.details_request_info?.madinah_check_out : packageData?.details_request_info?.makkah_check_out
                    }
                ],
                "adult": packageData?.original_request?.adult || 1,
                "child": packageData?.original_request?.child || 0,
                "infant": 0,
                "CabinType": "no",
                "MaxStopsQuantity": "All",
                "PricingSourceType": "All",
                "IsRefundable": false,
                "RequestOptions": "fifty",
                "NearByAirports": false,
                "AirTripType": "Return",
                "Target": "Test",
                "ConversationId": "395923377895446"
            };
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(params)
                });
                const response = await res.json();
                setIsLoading(false);
                if (response.success) {
                    setFlightList(response?.data?.flights || []);
                }
            } catch (error) {
                setIsLoading(false);
                console.log(error);
            }
        }
        getFlights();
    }, [packageData, returnAirport]); // Re-fetch when returnAirport changes

    // Handler to toggle return airport
    const handleReturnAirportChange = (airport) => {
        if (airport !== returnAirport) {
            setReturnAirport(airport);
        }
    };

    const renderFilters = () => (
        isLoading ? (
            <PackageFilterLoader />
        ) : (
            <>
                <hr />
                <Stops />
                <hr />
                <DepartureTimes />
                <hr />
                <JourneyDuration />
                <hr />
                <AirlineFilter />
                <hr />
                <FlightClass />
            </>
        )
    );

    const mobileFilterButton = (
        <button
            type="button"
            className={`d-md-none ${style.mobileFilterBtn}`}
            onClick={() => setFilterDrawerOpen(true)}
            aria-label="Open filters"
        >
            <MdFilterListAlt size={20} />
        </button>
    );

    const altReturnAirport = packageData?.details_request_info?.journey_type === 'makkahFirst' ? 'MED' : 'JED';
    const primaryReturnAirport = packageData?.details_request_info?.journey_type === 'makkahFirst' ? 'JED' : 'MED';

    return (
        <FlightProvider flights={flightList}>
            <div className={style.pageWrapper}>
                <div className={style.modifyheader}>
                    <h5 className={style.sectionTitle}>Customize Your Flights</h5>
                    <div className={style.flightRouteHeader}>
                        <div className={style.routeBlock}>
                            <p className={style.routeLabel}>Departure</p>
                            <p className={style.routeValue}>
                                {packageData?.details_request_info?.departure_city}
                                <IoAirplaneOutline size={15} />
                                {packageData?.details_request_info?.journey_type === 'makkahFirst' ? 'JED' : 'MED'}
                            </p>
                        </div>
                        <IoArrowForwardCircleOutline size={24} className={style.routeArrow} />
                        <div className={style.routeBlock}>
                            <p className={style.routeLabel}>Return</p>
                            <div className={style.returnOptions}>
                                <span
                                    className={`cursor-pointer ${style.returnOption} ${returnAirport === altReturnAirport ? style.returnOptionActive : ''}`}
                                    onClick={() => handleReturnAirportChange(altReturnAirport)}
                                >
                                    {altReturnAirport}
                                    <IoAirplaneOutline size={15} />
                                    {packageData?.details_request_info?.departure_city}
                                </span>
                                <MdOutlineChangeCircle size={16} className={style.swapIcon} />
                                <span
                                    className={`cursor-pointer ${style.returnOption} ${returnAirport === primaryReturnAirport ? style.returnOptionActive : ''}`}
                                    onClick={() => handleReturnAirportChange(primaryReturnAirport)}
                                >
                                    {primaryReturnAirport}
                                    <IoAirplaneOutline size={15} />
                                    {packageData?.details_request_info?.departure_city}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {isLoading ? (
                    <div className={style.layoutRow}>
                        <div className={`${style.filterCol} d-none d-md-block`}>
                            <div className={style.filterwrapper}>
                                <div className={style.filterHeader}>
                                    Filters
                                    <MdFilterListAlt />
                                </div>
                                <div className={style.filterBody}>
                                    <PackageFilterLoader />
                                </div>
                            </div>
                        </div>
                        <div className={style.resultsCol}>
                            <div className={style.resultsHeader}>
                                <p className={style.resultsCount}><FaPlane /> Loading flights...</p>
                                {mobileFilterButton}
                            </div>
                            <div className='row mb-3'>
                                <div className='col-md-3'>
                                    <div
                                        className="bg-light rounded w-100 placeholder-glow"
                                        style={{ height: "60px" }}
                                    >
                                        <span className="placeholder col-12 h-100 rounded"></span>
                                    </div>
                                </div>
                                <div className='col-md-3'>
                                    <div
                                        className="bg-light rounded w-100 placeholder-glow"
                                        style={{ height: "60px" }}
                                    >
                                        <span className="placeholder col-12 h-100 rounded"></span>
                                    </div>
                                </div>
                                <div className='col-md-3'>
                                    <div
                                        className="bg-light rounded w-100 placeholder-glow"
                                        style={{ height: "60px" }}
                                    >
                                        <span className="placeholder col-12 h-100 rounded"></span>
                                    </div>
                                </div>
                                <div className='col-md-3'>
                                    <div
                                        className="bg-light rounded w-100 placeholder-glow"
                                        style={{ height: "60px" }}
                                    >
                                        <span className="placeholder col-12 h-100 rounded"></span>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="bg-light mb-3 rounded w-100 placeholder-glow"
                                style={{ height: "150px" }}
                            >
                                <span className="placeholder col-12 h-100 rounded"></span>
                            </div>
                            <div
                                className="bg-light mb-3 rounded w-100 placeholder-glow"
                                style={{ height: "150px" }}
                            >
                                <span className="placeholder col-12 h-100 rounded"></span>
                            </div>
                            <div
                                className="bg-light mb-3 rounded w-100 placeholder-glow"
                                style={{ height: "150px" }}
                            >
                                <span className="placeholder col-12 h-100 rounded"></span>
                            </div>
                            <div
                                className="bg-light mb-3 rounded w-100 placeholder-glow"
                                style={{ height: "150px" }}
                            >
                                <span className="placeholder col-12 h-100 rounded"></span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={style.layoutRow}>
                        <div className={`${style.filterCol} d-none d-md-block`}>
                            <div className={style.filterwrapper}>
                                <div className={style.filterHeader}>
                                    Filters
                                    <MdFilterListAlt />
                                </div>
                                <div className={style.filterBody}>
                                    {renderFilters()}
                                </div>
                            </div>
                        </div>
                        <div className={style.resultsCol}>
                            <div className={style.resultsHeader}>
                                <p className={style.resultsCount}>
                                    <FaPlane />
                                    <span className={style.resultsCountNum}>{flightList.length}</span>
                                    Flights Found
                                </p>
                                {mobileFilterButton}
                            </div>
                            <PackageFlightCard originalFlight={originalFlight} onNext={onNext} />
                        </div>
                    </div>
                )}

                <Drawer
                    opened={filterDrawerOpen}
                    onClose={() => setFilterDrawerOpen(false)}
                    title="Filters"
                    position="bottom"
                    size="85%"
                    overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                    transitionProps={{ duration: 200 }}
                    withinPortal={true}
                    lockScroll={true}
                    classNames={{ content: style.mobileFilterDrawer }}
                >
                    {renderFilters()}
                    <div className="border-top pt-3 mt-3">
                        <button
                            type="button"
                            className="btn btn-success w-100"
                            onClick={() => setFilterDrawerOpen(false)}
                        >
                            Done
                        </button>
                    </div>
                </Drawer>
            </div>
        </FlightProvider>
    );
}
