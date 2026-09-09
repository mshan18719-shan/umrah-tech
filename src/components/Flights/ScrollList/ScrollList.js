import React, { useEffect, useRef } from 'react'
import styles from './ScrollList.module.css';
import { FaPlane } from 'react-icons/fa';
import { Newsreader } from 'next/font/google';

const newsreader = Newsreader({ subsets: ['latin'], weight: '400' });
// pixels per second — increase to slow down
const SPEED = 60;

export default function ScrollList({flightList}) {
    const marqueeRef = useRef(null);

    useEffect(() => {
        if (!marqueeRef.current) return;
        const contentWidth = marqueeRef.current.scrollWidth / 2; // duplicated content
        const duration = Math.max(30, contentWidth / SPEED);
        marqueeRef.current.style.setProperty('--marquee-duration', `${duration}s`);
    }, [flightList]);

    // Extract flight info from the flight list
    const getFlightInfo = () => {
        if (!flightList || flightList.length === 0) return [];
        
        return flightList.map((flight, index) => {
            const segments = flight.segments || [];
            const routes = [];
            
            if (segments.length === 0) return { id: index, routes: [] };
            
            // Check if it's a return trip
            if (flight.trip_type === 'return') {
                // Split segments into outbound and return
                const midpoint = Math.ceil(segments.length / 2);
                const outboundSegments = segments.slice(0, midpoint);
                const returnSegments = segments.slice(midpoint);
                
                // Process outbound
                if (outboundSegments.length > 0) {
                    const departure = outboundSegments[0].departure.airport_code;
                    const arrival = outboundSegments[outboundSegments.length - 1].arrival.airport_code;
                    const stops = outboundSegments.length - 1;
                    const segmentFlightNumbers = outboundSegments
                        .map(seg => `${seg.airline?.code}${seg.flight_number}`)
                        .join(', ');
                    
                    routes.push({
                        departure,
                        arrival,
                        stops,
                        flightNumbers: segmentFlightNumbers,
                        isReturn: false
                    });
                }
                
                // Process return
                if (returnSegments.length > 0) {
                    const departure = returnSegments[0].departure.airport_code;
                    const arrival = returnSegments[returnSegments.length - 1].arrival.airport_code;
                    const stops = returnSegments.length - 1;
                    const segmentFlightNumbers = returnSegments
                        .map(seg => `${seg.airline?.code}${seg.flight_number}`)
                        .join(', ');
                    
                    routes.push({
                        departure,
                        arrival,
                        stops,
                        flightNumbers: segmentFlightNumbers,
                        isReturn: true
                    });
                }
            } else {
                // One-way trip
                const departure = segments[0].departure.airport_code;
                const arrival = segments[segments.length - 1].arrival.airport_code;
                const stops = segments.length - 1;
                const segmentFlightNumbers = segments
                    .map(seg => `${seg.airline?.code}${seg.flight_number}`)
                    .join(', ');
                
                routes.push({
                    departure,
                    arrival,
                    stops,
                    flightNumbers: segmentFlightNumbers,
                    isReturn: false
                });
            }
            
            return {
                id: index,
                routes
            };
        });
    };

    const flightInfo = getFlightInfo();

    // Render content with duplication for seamless loop
    const renderContent = () => {
        const content = flightInfo.length > 0 ? (
            flightInfo.map((flight) => (
                flight.routes.map((route, routeIndex) => (
                    <span
                        key={`${flight.id}-${routeIndex}`}
                        className="d-inline-flex align-items-center me-4"
                        style={{ whiteSpace: "nowrap" }}
                    >
                        <h6 className="px-3 py-2 bg-primary-subtle mb-0 fs-10 rounded-1 me-2">
                            {flight.id + 1}{route.isReturn ? 'R' : ''}
                        </h6>
                        <h6 className="mb-0 text-white fw-semibold me-3 text-nowrap">
                            {route.flightNumbers}
                        </h6>
                        <h6 className="mb-0 fw-semibold text-white">{route.departure}</h6>
                        <FaPlane className="text-primary mx-2" />
                        <h6 className={`mb-0 ${styles.pe6} fw-semibold text-white me-2`}>
                            {route.arrival}
                        </h6>
                        {route.stops > 0 && (
                            <h6 className="mb-0 text-danger fw-semibold me-3">
                                ({route.stops} {route.stops === 1 ? 'Stop' : 'Stops'})
                            </h6>
                        )}
                        <span className="border-end border-secondary me-3" style={{height: '20px'}}></span>
                    </span>
                ))
            ))
        ) : (
            <span className="d-inline-flex align-items-center me-4">
                <h6 className="mb-0 text-white">No flights available</h6>
            </span>
        );

        return content;
    };

    return (
        <div>
            <div className=" mb-4">
                <div className={`d-block d-md-flex ${styles.trackingwrapper} align-items-center overflow-hidden rounded-1`}>

                    <div className="h-100 px-3 d-flex align-items-center bg-danger-subtle position-relative z-5">
                        <h3 className={`mb-0 fw-bold text-nowrap d-none d-md-block ${newsreader.className}`}>{flightList.length} {flightList.length > 1 ? 'Flights' : 'Flight'} Found</h3>
                    </div>

                    <div className={styles.marquee}>
                        <div ref={marqueeRef} className={styles.marqueeContent}>
                            {renderContent()}
                            {renderContent()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
