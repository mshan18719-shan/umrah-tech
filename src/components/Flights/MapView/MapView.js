'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { GoogleMap, LoadScriptNext, Marker, Polyline } from "@react-google-maps/api";
import { FaAngleLeft, FaPlane, FaTimes } from 'react-icons/fa';
import { LuClock } from 'react-icons/lu';
import moment from 'moment';
import airportLocation from '@/util/airportsLocations';
import airlineNames from '@/util/airlineNames.json';
import styles from './MapView.module.css';
import FlightDetail from '../FlightDetail';
import PriceDisplay from '@/components/Currency/PriceDisplay';

export default function MapView({ flightList }) {
    const [selectedAirport, setSelectedAirport] = useState(null);
    const [airportFlights, setAirportFlights] = useState([]);
    const [containerStyle, setContainerStyle] = useState({ width: "100%", height: "40vh" });

    // Create airport lookup map for faster access
    const airportLookup = useMemo(() => {
        const lookup = {};
        airportLocation.forEach(airport => {
            if (airport.iata) {
                lookup[airport.iata] = {
                    lat: airport.lat,
                    lng: airport.lng,
                    name: airport.name,
                    city: airport.city,
                    country: airport.country
                };
            }
        });
        return lookup;
    }, []);
    useEffect(() => {
        const updateContainerStyle = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setContainerStyle({ width: "100%", height: "50vh" });
            } else {
                setContainerStyle({ width: "100%", height: "40vh" });
            }
        };
        updateContainerStyle();
        window.addEventListener('resize', updateContainerStyle);
        return () => window.removeEventListener('resize', updateContainerStyle);
    }, []);

    // Extract all routes from flight list
    const { routes, allAirports, centerPoint } = useMemo(() => {
        if (!flightList || flightList.length === 0) {
            return { routes: [], allAirports: new Map(), centerPoint: { lat: 25, lng: 55 } };
        }

        const airportsMap = new Map();
        const flightRoutes = [];

        flightList.forEach((flight, flightIndex) => {
            const segments = flight.segments || [];
            
            if (segments.length === 0) return;
            
            // Check if it's a return trip
            if (flight.trip_type === 'return') {
                const midpoint = Math.ceil(segments.length / 2);
                const outboundSegments = segments.slice(0, midpoint);
                const returnSegments = segments.slice(midpoint);
                
                // Process outbound and return
                [outboundSegments, returnSegments].forEach((segmentGroup, groupIndex) => {
                    const routePath = [];
                    
                    segmentGroup.forEach((segment) => {
                        const depCode = segment.departure.airport_code;
                        const arrCode = segment.arrival.airport_code;

                        // Add departure airport
                        if (airportLookup[depCode] && !airportsMap.has(depCode)) {
                            airportsMap.set(depCode, {
                                code: depCode,
                                ...airportLookup[depCode]
                            });
                        }

                        // Add arrival airport
                        if (airportLookup[arrCode] && !airportsMap.has(arrCode)) {
                            airportsMap.set(arrCode, {
                                code: arrCode,
                                ...airportLookup[arrCode]
                            });
                        }

                        // Build route path
                        if (routePath.length === 0 && airportLookup[depCode]) {
                            routePath.push({
                                lat: airportLookup[depCode].lat,
                                lng: airportLookup[depCode].lng,
                                code: depCode
                            });
                        }

                        if (airportLookup[arrCode]) {
                            routePath.push({
                                lat: airportLookup[arrCode].lat,
                                lng: airportLookup[arrCode].lng,
                                code: arrCode
                            });
                        }
                    });

                    if (routePath.length > 1) {
                        flightRoutes.push({
                            path: routePath,
                            isReturn: groupIndex === 1,
                            flightIndex: flightIndex
                        });
                    }
                });
            } else {
                // One-way trip
                const routePath = [];
                
                segments.forEach((segment) => {
                    const depCode = segment.departure.airport_code;
                    const arrCode = segment.arrival.airport_code;

                    if (airportLookup[depCode] && !airportsMap.has(depCode)) {
                        airportsMap.set(depCode, {
                            code: depCode,
                            ...airportLookup[depCode]
                        });
                    }

                    if (airportLookup[arrCode] && !airportsMap.has(arrCode)) {
                        airportsMap.set(arrCode, {
                            code: arrCode,
                            ...airportLookup[arrCode]
                        });
                    }

                    if (routePath.length === 0 && airportLookup[depCode]) {
                        routePath.push({
                            lat: airportLookup[depCode].lat,
                            lng: airportLookup[depCode].lng,
                            code: depCode
                        });
                    }

                    if (airportLookup[arrCode]) {
                        routePath.push({
                            lat: airportLookup[arrCode].lat,
                            lng: airportLookup[arrCode].lng,
                            code: arrCode
                        });
                    }
                });

                if (routePath.length > 1) {
                    flightRoutes.push({
                        path: routePath,
                        isReturn: false,
                        flightIndex: flightIndex
                    });
                }
            }
        });

        // Calculate center point (average of all airports)
        let centerLat = 0, centerLng = 0;
        const airports = Array.from(airportsMap.values());
        if (airports.length > 0) {
            airports.forEach(airport => {
                centerLat += airport.lat;
                centerLng += airport.lng;
            });
            centerLat /= airports.length;
            centerLng /= airports.length;
        }

        return {
            routes: flightRoutes,
            allAirports: airportsMap,
            centerPoint: { lat: centerLat, lng: centerLng }
        };
    }, [flightList, airportLookup]);

    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 85%, 55%)`;
    }
    // Polyline options with both dotted line and arrow
    const getFlightPathOptions = (isReturn, color) => ({
        strokeColor: isReturn ? color : color,
        strokeOpacity: 0.3,
        strokeWeight: .4,
        icons: [
            {
                // Arrow/Plane icon
                icon: {
                    path: "M20.946 15.076L14 9.84V5.19a4.6 4.6 0 0 0-2-4.183 4.6 4.6 0 0 0-2 4.183v4.648l-6.946 5.237S2 15.895 2 16.714v1.046l7.994-3.142.802 4.73c-2.13 2.171-2.808 2.255-2.808 2.633V23L12 22.008l4.012.992v-1.019c0-.379-.678-.462-2.808-2.633l.802-4.73L22 17.76v-1.046c0-.819-1.054-1.638-1.054-1.638zm-7.723-1.84l-1.094 6.447.358.364a24.83 24.83 0 0 0 1.502 1.422L12 20.978l-1.989.49c.4-.344.894-.8 1.502-1.421l.358-.364-1.094-6.448-7.406 2.911a2.541 2.541 0 0 1 .3-.28l7.326-5.53V5.19A4.081 4.081 0 0 1 12 2.288a4.081 4.081 0 0 1 1.003 2.902v5.146l7.337 5.537a2.718 2.718 0 0 1 .292.274z",
                    strokeColor: isReturn ? color : color,
                    strokeOpacity: 0,
                    strokeWeight: .2,
                    scale: 1,
                    fillOpacity: .6,
                    anchor: { x: 12, y: 2 },
                },
                offset: "0",
                repeat: "200px",
            }
        ],
    });
    const HandleAirportClick = (airport) => {
        try {

            // Find all flights that pass through this airport
            const flightsThroughAirport = flightList.filter((flight) => {
                return flight.segments?.some((segment) => {
                    return segment.departure.airport_code === airport.code ||
                        segment.arrival.airport_code === airport.code;
                });
            });

            setSelectedAirport(airport);
            setAirportFlights(flightsThroughAirport);
        } catch (error) {
            console.error("Error in HandleAirportClick:", error);
        }
    };

    const handleCloseAirportPanel = () => {
        setSelectedAirport(null);
        setAirportFlights([]);
    };

    // Allow panel to scroll independently
    const handlePanelScroll = (e) => {
        e.stopPropagation();
    };

    return (
        <div className={styles.mapContainer}>
            {flightList.length != 0 && (
                <LoadScriptNext googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={centerPoint}
                        zoom={4}
                    >
                        {/* Render all airport markers */}
                        {Array.from(allAirports.values()).map((airport, index) => (
                            <Marker
                                key={`airport-${airport.code}`}
                                position={{ lat: airport.lat, lng: airport.lng }}
                                label={{
                                    text: airport.code,
                                    color: "#fff",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                }}
                                onClick={() => HandleAirportClick(airport)}
                                title={`${airport.name} (${airport.code})\n${airport.city}, ${airport.country}`}
                                icon={{
                                    path: "M 0, 0 m -8, 0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0",
                                    fillColor: selectedAirport?.code === airport.code ? "#ef4444" : "#1d4fd8",
                                    fillOpacity: 1,
                                    strokeColor: "#ffffff",
                                    strokeWeight: 1,
                                    scale: selectedAirport?.code === airport.code ? 2 : 1.6,
                                }}
                            />
                        ))}

                        {/* Render all flight routes */}
                        {routes.map((route, index) => (
                            <Polyline
                                key={`route-${index}`}
                                path={route.path}
                                options={getFlightPathOptions(route.isReturn, getRandomColor())}
                            />
                        ))}
                    </GoogleMap>
                </LoadScriptNext>
            )}

            {/* Airport Details Panel */}
            {selectedAirport && (
                <div className={styles.airportPanel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <h3 className={styles.airportTitle}>
                                <FaPlane className={styles.planeIcon} />
                                {selectedAirport.name}
                            </h3>
                            <p className={styles.airportSubtitle}>
                                {selectedAirport.code} - {selectedAirport.city}, {selectedAirport.country}
                            </p>
                        </div>
                        <button
                            className={styles.closeButton}
                            onClick={handleCloseAirportPanel}
                            aria-label="Close"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className={styles.panelContent} onWheel={handlePanelScroll}>
                        <div className={styles.flightCount}>
                            {airportFlights.length} {airportFlights.length === 1 ? 'Flight' : 'Flights'} through this airport
                        </div>

                        {airportFlights.length > 0 ? (
                            <div className={styles.flightsList}>
                                {airportFlights.map((flight, flightIndex) => {
                                    const groupSegments = (flightData) => {
                                        if (!flightData || !flightData.segments) return [];
                                        if (flightData.trip_type === 'return') {
                                            const midpoint = Math.ceil(flightData.segments.length / 2);
                                            return [
                                                { segments: flightData.segments.slice(0, midpoint), label: 'Departure' },
                                                { segments: flightData.segments.slice(midpoint), label: 'Return' }
                                            ];
                                        }
                                        return [{ segments: flightData.segments, label: 'Departure' }];
                                    };

                                    return (
                                    <div key={flightIndex} className={styles.flightItem}>
                                        {groupSegments(flight).map((group, odIndex) => {
                                            const totalTime = group.segments.reduce(
                                                (sum, seg) => sum + seg.duration,
                                                0
                                            );
                                            const length = group.segments.length;
                                            const firstSegment = group.segments[0];
                                            const lastSegment = group.segments[length - 1];
                                            const airlineData = airlineNames.find(
                                                (airline) =>
                                                    airline.code === firstSegment.airline?.code ||
                                                    airline.ncode === firstSegment.airline?.code
                                            );

                                            return (
                                                <div key={odIndex} className={styles.flightSegment}>
                                                    <div className={styles.airlineInfo}>
                                                        <strong>{airlineData ? airlineData.name : firstSegment.airline?.code}</strong>
                                                        <span className={styles.cabinClass}>
                                                            {firstSegment?.cabin_class?.name}
                                                        </span>
                                                    </div>

                                                    <div className={styles.flightRoute}>
                                                        <div className={styles.routePoint}>
                                                            <div className={styles.airportCode}>
                                                                {firstSegment.departure.airport_code}
                                                            </div>
                                                            <div className={styles.timeInfo}>
                                                                <LuClock size={12} />
                                                                {moment(firstSegment.departure.datetime).format('LT')}
                                                            </div>
                                                            <div className={styles.dateInfo}>
                                                                {moment(firstSegment.departure.datetime).format('MMM DD')}
                                                            </div>
                                                        </div>

                                                        <div className={styles.routeMiddle}>
                                                            <div className={styles.routeLine}></div>
                                                            <div className={styles.routeDetails}>
                                                                <div className={styles.duration}>
                                                                    {Math.floor(totalTime / 60)}h {totalTime % 60}m
                                                                </div>
                                                                <div className={styles.stops}>
                                                                    {length === 1 ? 'Direct' : `${length - 1} stop${length - 1 > 1 ? 's' : ''}`}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className={styles.routePoint}>
                                                            <div className={styles.airportCode}>
                                                                {lastSegment.arrival.airport_code}
                                                            </div>
                                                            <div className={styles.timeInfo}>
                                                                <LuClock size={12} />
                                                                {moment(lastSegment.arrival.datetime).format('LT')}
                                                            </div>
                                                            <div className={styles.dateInfo}>
                                                                {moment(lastSegment.arrival.datetime).format('MMM DD')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.flightPrice}>
                                                        <FlightDetail flightdata={flight} /> <PriceDisplay price={flight.pricing?.total_amount} currency={flight.pricing?.currency} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.noFlights}>
                                <p>No flights found passing through this airport</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
