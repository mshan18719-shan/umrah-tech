import React, { useState, useEffect, useRef, useCallback } from "react";
import FlightDetail from "@/components/Flights/FlightDetail";
import { useFlightList } from "@/components/Flights/FlightListingContext";
import moment from "moment";
import airline from "@/util/airlines.json";
import PriceDisplay from '@/components/Currency/PriceDisplay';
import Image from "next/image";
import { FaPlane } from "react-icons/fa";
import UmrahPagination from '../Listing/UmrahPagination';
import styles from './FlightCard.module.css';


export default function FlightCard({ originalFlight, onSelectFlight }) {
    const { flights, currentPage, setCurrentPage, totalFlights } = useFlightList();
    const [displayedFlights, setDisplayedFlights] = useState([]);
    const prevPageRef = useRef(1);

    useEffect(() => {
        if (currentPage === 1) {
            setDisplayedFlights(flights);
            prevPageRef.current = 1;
        } else if (currentPage > prevPageRef.current) {
            setDisplayedFlights(prev => [...prev, ...flights]);
            prevPageRef.current = currentPage;
        }
    }, [flights, currentPage]);

    const hasMore = displayedFlights.length < totalFlights;

    const loadMore = useCallback(() => {
        if (displayedFlights.length < totalFlights) {
            setCurrentPage(prev => prev + 1);
        }
    }, [displayedFlights.length, totalFlights, setCurrentPage]);

    // Get base price from original flight (if no error and valid price exists)
    const basePrice = originalFlight?.revalidateDetails?.error ? null : originalFlight?.pricing?.total_amount;
    const baseCurrency = originalFlight?.pricing?.currency;

    // Calculate price difference
    const getPriceDifference = (currentPrice) => {
        if (!basePrice || basePrice === null) {
            // No valid base price, return null to show full price
            return null;
        }
        const difference = currentPrice - basePrice;
        if (difference > 0) {
            return { value: difference, display: `+${difference.toFixed(2)}`, type: 'increase' };
        } else if (difference < 0) {
            return { value: difference, display: `${difference.toFixed(2)}`, type: 'decrease' };
        } else {
            return { value: 0, display: '0', type: 'same' };
        }
    };

    const groupSegments = (flight) => {
        if (flight.trip_type === 'return') {
            const legs = flight?.search_criteria?.legs || [];
            if (legs.length === 0) {
                const midpoint = Math.ceil(flight.segments.length / 2);
                return [
                    { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
                    { segments: flight.segments.slice(midpoint), label: 'Return' }
                ];
            }
            const groupedLegs = [];
            let segmentIndex = 0;
            const labels = ['Departure', 'Return'];

            legs.forEach((leg, legIndex) => {
                const legSegments = [];
                while (segmentIndex < flight.segments.length) {
                    const segment = flight.segments[segmentIndex];
                    legSegments.push(segment);
                    segmentIndex++;
                    if (segment.arrival?.airport_code === leg.destination) break;
                }
                if (legSegments.length) {
                    groupedLegs.push({
                        segments: legSegments,
                        label: labels[legIndex] || `Flight ${legIndex + 1}`,
                    });
                }
            });

            return groupedLegs;
        } else if (flight.trip_type === 'multicity') {
            const legs = flight.search_criteria?.legs || [];
            if (legs.length === 0) {
                return flight.segments.map((segment, idx) => ({
                    segments: [segment],
                    label: `Flight ${idx + 1}`
                }));
            }

            const groupedLegs = [];
            let currentSegmentIndex = 0;

            legs.forEach((leg, legIndex) => {
                const legSegments = [];
                const destination = leg.destination;

                while (currentSegmentIndex < flight.segments.length) {
                    const segment = flight.segments[currentSegmentIndex];
                    legSegments.push(segment);
                    currentSegmentIndex++;

                    if (segment.arrival.airport_code === destination) {
                        break;
                    }
                }

                if (legSegments.length > 0) {
                    groupedLegs.push({
                        segments: legSegments,
                        label: `Flight ${legIndex + 1}`
                    });
                }
            });

            return groupedLegs;
        }
        return [{ segments: flight.segments, label: 'Departure' }];
    };

    return (
        <div>
            {displayedFlights.map((item, index) => {
                const segmentGroups = groupSegments(item);
                const isSelected = false;

                return (
                    <div
                        key={index}
                        className={`${styles.flightCard} ${isSelected ? styles.flightCardSelected : ''}`}
                    >
                        {isSelected && (
                            <div className={styles.selectedBanner}>
                                <strong>✓ Selected Flight</strong> — This flight is included in your package
                            </div>
                        )}
                        <div className={styles.cardBody}>
                            <div className={styles.segmentsCol}>
                                {segmentGroups.map((group, idx) => {
                                    const firstSegment = group.segments[0];
                                    const lastSegment = group.segments[group.segments.length - 1];
                                    const totalTime = group.segments.reduce((acc, seg, idx) => {
                                        let time = acc + seg.duration;
                                        const nextSeg = group.segments[idx + 1];
                                        if (nextSeg) {
                                            time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
                                        }
                                        return time;
                                    }, 0);
                                    const airlineData = airline.find((a) => a.iata === firstSegment.airline.code);
                                    const durationLabel = `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`;
                                    const dayDiff = moment(lastSegment.arrival.datetime).startOf('day').diff(
                                        moment(firstSegment.departure.datetime).startOf('day'),
                                        'days'
                                    );
                                    const stopLabel = group.segments.length === 1 && group.segments[0].stops === 0
                                        ? 'Direct'
                                        : `${group.segments.length - 1} ${group.segments.length - 1 === 1 ? 'stop' : 'stops'}`;
                                    const logoSrc = firstSegment.airline?.logo_url || airlineData?.logo;

                                    return (
                                        <div key={idx} className={styles.legCard}>
                                            <div className={styles.legHeader}>
                                                <span className={`${styles.legBadge} ${item.trip_type === 'multicity'
                                                    ? styles.legBadgeOther
                                                    : idx === 0
                                                        ? styles.legBadgeDeparture
                                                        : styles.legBadgeReturn
                                                    }`}>
                                                    <FaPlane size={9} />
                                                    {group.label}
                                                </span>
                                                <span className={styles.legDate}>{moment(firstSegment.departure.datetime).format('ddd, DD MMM YYYY')}</span>
                                            </div>

                                            {/* Mobile: logo + name + duration on one line */}
                                            <div className={styles.airlineRowMobile}>
                                                <div className={styles.airlineInfo}>
                                                    {logoSrc && (
                                                        <Image
                                                            src={logoSrc}
                                                            height={22}
                                                            width={22}
                                                            quality={50}
                                                            alt={firstSegment.airline.code + '-' + idx}
                                                            className={styles.airlineLogo}
                                                        />
                                                    )}
                                                    <div className={styles.airlineText}>
                                                        <span className={styles.airlineName}>
                                                            {firstSegment.airline.name || airlineData?.name || firstSegment.airline.code}
                                                        </span>
                                                        <span className={styles.cabinClass}>
                                                            {firstSegment.cabin_class?.name || 'Economy'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={styles.durationInline}>
                                                    <span className={styles.durationLabel}>Duration</span>
                                                    <span className={styles.durationValue}>{durationLabel}</span>
                                                </div>
                                            </div>

                                            <div className={styles.flightBody}>
                                                {/* Desktop: airline column */}
                                                <div className={styles.airlineColDesktop}>
                                                    <div className={styles.airlineInfoDesktop}>
                                                        {logoSrc && (
                                                            <div className={styles.airlineLogoWrap}>
                                                                <Image
                                                                    src={logoSrc}
                                                                    height={30}
                                                                    width={30}
                                                                    quality={50}
                                                                    alt={firstSegment.airline.code + '-' + idx}
                                                                    className={styles.airlineLogo}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={styles.airlineTextDesktop}>
                                                            <span className={styles.airlineNameDesktop}>
                                                                {firstSegment.airline.name || airlineData?.name || firstSegment.airline.code}
                                                            </span>
                                                            <span className={styles.cabinClassDesktop}>
                                                                {firstSegment.cabin_class?.name || 'Economy'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={styles.durationColDesktop}>
                                                    <div className={styles.durationLabelDesktop}>Duration</div>
                                                    <div className={styles.durationValueDesktop}>{durationLabel}</div>
                                                </div>

                                                {/* Route row */}
                                                <div className={styles.routeRow}>
                                                    <div className={styles.flightEndpoint}>
                                                        <div className={styles.flightTime}>{moment(firstSegment.departure.datetime).format('LT')}</div>
                                                        <div className={styles.airportCode}>{firstSegment.departure.airport_code}</div>
                                                    </div>

                                                    <div className={styles.flightMiddle}>
                                                        <span className={styles.durationAboveRoute}>
                                                            DURATION {durationLabel.toUpperCase()}
                                                        </span>
                                                        <span className={`${styles.stopsPill} ${stopLabel === 'Direct' ? styles.stopsPillDirect : styles.stopsPillStops}`}>
                                                            {stopLabel === 'Direct' ? 'DIRECT' : stopLabel.toUpperCase()}
                                                        </span>
                                                        <div className={styles.flightLine}>
                                                            <div className={styles.line} />
                                                            <FaPlane className={styles.routePlaneIcon} size={11} />
                                                        </div>
                                                    </div>

                                                    <div className={styles.flightEndpointRight}>
                                                        <div className={styles.flightTime}>
                                                            {moment(lastSegment.arrival.datetime).format('LT')}
                                                            {dayDiff > 0 && <sup className={styles.dayOffset}>+{dayDiff}</sup>}
                                                        </div>
                                                        <div className={styles.airportCode}>{lastSegment.arrival.airport_code}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.cardFooter}>
                                <div className={`${styles.detailsCol} flight-details-more px-0`}>
                                    <FlightDetail flightdata={item} linkTrigger />
                                </div>

                                <div className={styles.priceCol}>
                                    <div className={styles.priceBlock}>
                                    {(() => {
                                        const priceDiff = getPriceDifference(item?.pricing?.total_amount);

                                        if (priceDiff === null) {
                                            return (
                                                <>
                                                    <p className={styles.priceMain}>
                                                        <PriceDisplay price={item?.pricing?.total_amount} currency={item?.pricing?.currency} />
                                                    </p>
                                                    <span className={styles.priceNote}>VAT and taxes included</span>
                                                </>
                                            );
                                        } else if (priceDiff.value === 0) {
                                            return (
                                                <>
                                                    <p className={styles.priceMain}>
                                                        <PriceDisplay price={item?.pricing?.total_amount} currency={item?.pricing?.currency} />
                                                    </p>
                                                    <div className={styles.priceSame}>Same as package flight</div>
                                                </>
                                            );
                                        } else {
                                            return (
                                                <>
                                                    <div className={`${styles.priceDiffLabel} ${priceDiff.type === 'increase' ? styles.priceDiffIncrease : styles.priceDiffDecrease}`}>
                                                        {priceDiff.type === 'increase' ? 'Total Extra Cost' : 'You save'}
                                                    </div>
                                                    <div className={`${styles.priceDiffAmount} ${priceDiff.type === 'increase' ? styles.priceDiffIncrease : styles.priceDiffDecrease}`}>
                                                        <PriceDisplay price={priceDiff.display} currency={item?.pricing?.currency} />
                                                    </div>
                                                    <div className={styles.priceTotal}>
                                                        Total: <PriceDisplay price={item?.pricing?.total_amount} currency={item?.pricing?.currency} />
                                                    </div>
                                                </>
                                            );
                                        }
                                    })()}
                                </div>
                                <div className={styles.selectBtnWrap}>

                                    <button
                                        type="button"
                                        onClick={() => onSelectFlight?.(item)}
                                        className={`${styles.selectBtn} ${styles.selectBtnOutline}`}
                                    >
                                        Select Flight
                                    </button>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                );
            })}

            <UmrahPagination hasMore={hasMore} onLoadMore={loadMore} />
        </div>
    );
}
