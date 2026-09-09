'use client'
import moment from 'moment';
import Image from 'next/image';
import React, { useState } from 'react'
import { FaPlane, FaAngleDown, FaCheckCircle } from 'react-icons/fa';
import CustomizeFlight from './CustomizeFlight';
import FlightDetail from '@/components/Flights/FlightDetail';
import airline from "@/util/airlines.json"
import { useUmrahPackage } from '@/contexts/UmrahPackageContext';
import style from './FlightSelection.module.css';

export default function FlightSelection({ detail, onNext }) {
    const { selections } = useUmrahPackage();
    const [showMoreFlights, setShowMoreFlights] = useState(false);
    const [flightDetailOpen, setFlightDetailOpen] = useState(false);

    const displayFlight = selections.customFlight || detail;

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
        }
        return [{ segments: flight.segments, label: 'Departure' }];
    };

    const getLegMeta = (group) => {
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
        const stops = group.segments.length - 1;
        const stopLabel = stops === 0 ? 'Direct' : `${stops} ${stops === 1 ? 'stop' : 'stops'}`;
        const airlineData = airline.find((a) => a.iata === firstSegment.airline.code);
        const logoSrc = firstSegment.airline?.logo_url || airlineData?.logo;

        return {
            firstSegment,
            lastSegment,
            totalTime,
            stopLabel,
            logoSrc,
            airlineName: firstSegment.airline.name || airlineData?.name || firstSegment.airline.code,
            cabinClass: firstSegment.cabin_class?.name || 'Economy',
        };
    };

    const renderFlightLeg = (group, idx) => {
        const {
            firstSegment,
            lastSegment,
            totalTime,
            stopLabel,
            logoSrc,
            airlineName,
            cabinClass,
        } = getLegMeta(group);
        const hours = Math.floor(totalTime / 60);
        const mins = totalTime % 60;
        const isReturn = group.label === 'Return';

        return (
            <div key={idx} className={style.legCard}>
                <div className={style.legHeader}>
                    <span className={`${style.legBadge} ${isReturn ? style.legBadgeReturn : style.legBadgeDeparture}`}>
                        <FaPlane size={10} />
                        {group.label}
                    </span>
                    <span className={style.legDate}>
                        {moment(firstSegment.departure.datetime).format('ddd, DD MMM YYYY')}
                    </span>
                </div>

                <div className={style.flightRow}>
                    <div className={style.airlineCol}>
                        <div className={style.airlineInfo}>
                            <div className={style.airlineLogoWrap}>
                                {logoSrc ? (
                                    <Image
                                        src={logoSrc}
                                        height={32}
                                        width={32}
                                        quality={50}
                                        alt={firstSegment.airline.code}
                                        className={style.airlineLogo}
                                    />
                                ) : (
                                    <span className={style.airlineCodeFallback}>{firstSegment.airline.code}</span>
                                )}
                            </div>
                            <div className={style.airlineText}>
                                <span className={style.airlineName}>{airlineName}</span>
                                <span className={style.airlineClass}>{cabinClass}</span>
                            </div>
                        </div>
                    </div>

                    <div className={style.routeCol}>
                        <div className={style.flightEndpoint}>
                            <span className={style.flightTime}>
                                {moment(firstSegment.departure.datetime).format('LT')}
                            </span>
                            <span className={style.airportCode}>{firstSegment.departure.airport_code}</span>
                        </div>

                        <div className={style.flightMiddle}>
                            <span className={style.durationPill}>
                                {hours}h {mins}m · {stopLabel}
                            </span>
                            <div className={style.flightLine}>
                                <div className={style.line} />
                                <FaPlane className={style.planeIcon} size={11} />
                            </div>
                        </div>

                        <div className={style.flightEndpointRight}>
                            <span className={style.flightTime}>
                                {moment(lastSegment.arrival.datetime).format('LT')}
                            </span>
                            <span className={style.airportCode}>{lastSegment.arrival.airport_code}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={style.flightSection}>
            <div className={style.flightHeader}>
                <div className={style.flightHeaderTop}>
                    <span className={style.includedBadge}>
                        <FaPlane size={11} />
                        Package Flight
                    </span>
                </div>
                <p className={style.flightDisclaimer}>
                Flight schedules, airlines, and routing are subject to availability and may change upon confirmation.
                </p>
            </div>

            {selections.customFlight && (
                <div className={style.customFlightAlert}>
                    <FaCheckCircle size={16} />
                    <span><strong>Custom flight selected</strong> — you chose a different option from the available flights.</span>
                </div>
            )}

            <div className={style.flightCard}>
                {displayFlight?.revalidateDetails?.error ? (
                    <div className={style.errorState}>
                        <h5 className={style.errorTitle}>
                            {detail?.revalidateDetails?.error?.message || 'The flight session has expired. Please reselect your flight to continue.'}
                        </h5>
                        <p className={style.errorHint}>Want more options? Click &ldquo;Change Flight Options&rdquo; below.</p>
                    </div>
                ) : (
                    <>
                        {groupSegments(displayFlight).map((group, idx) => renderFlightLeg(group, idx))}

                        <div className={style.flightActions}>
                            <button
                                type="button"
                                className={style.flightDetailsBtn}
                                onClick={() => setFlightDetailOpen(true)}
                            >
                                Flight Details
                                <FaAngleDown size={12} />
                            </button>
                            <button
                                type="button"
                                className={style.proceedBtn}
                                onClick={() => onNext && onNext()}
                            >
                                Proceed with This Flight
                            </button>
                        </div>

                        <FlightDetail
                            flightdata={displayFlight}
                            outlineBtn="umrahgetaway"
                            showFlights={flightDetailOpen}
                            onClose={() => setFlightDetailOpen(false)}
                        />
                    </>
                )}
            </div>

            <div className={style.flightFooter}>
                <button
                    type="button"
                    onClick={() => setShowMoreFlights(!showMoreFlights)}
                    className={style.changeFlightBtn}
                >
                    <FaPlane size={14} />
                    {showMoreFlights ? 'Hide Flight Options' : 'Change Flight Options'}
                </button>
            </div>

            {showMoreFlights && <CustomizeFlight originalFlight={detail} onNext={onNext} />}
        </div>
    )
}
