'use client';

import React from 'react';
import moment from 'moment';
import Image from 'next/image';
import { FaPlane } from 'react-icons/fa';
import airline from '@/util/airlines.json';
import { groupSegments } from './flightHelpers';
import styles from './FlightReviewHero.module.css';

function formatDurationLabel(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `Duration ${hours}h ${mins}m`;
}

function getStopLabel(group) {
    const stops = group.segments.length - 1;
    if (stops <= 0 && group.segments[0]?.stops === 0) return 'Direct';
    if (stops <= 0) return 'Direct';
    return `${stops} ${stops === 1 ? 'Stop' : 'Stops'}`;
}

function getLegBadgeClass(tripType, idx) {
    if (tripType === 'multicity') return styles.legBadgeOther;
    return idx === 0 ? styles.legBadgeDeparture : styles.legBadgeReturn;
}

export default function FlightReviewHero({ flightDetails }) {
    if (!flightDetails?.segments?.length) return null;

    const segmentGroups = groupSegments(flightDetails);

    return (
        <section className={styles.reviewCard} aria-label="Flight booking review">
            {segmentGroups.map((group, idx) => {
                const firstSegment = group.segments[0];
                const lastSegment = group.segments[group.segments.length - 1];
                const totalTime = group.segments.reduce((acc, seg, segIdx) => {
                    let time = acc + seg.duration;
                    const nextSeg = group.segments[segIdx + 1];
                    if (nextSeg) {
                        time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
                    }
                    return time;
                }, 0);
                const dayDiff = moment(lastSegment?.arrival?.datetime).startOf('day').diff(
                    moment(firstSegment?.departure?.datetime).startOf('day'), 'days'
                );
                const airlineData = airline.find((a) => a.iata === firstSegment.airline.code);
                const durationLabel = formatDurationLabel(totalTime);
                const stopLabel = getStopLabel(group);
                const logoSrc = firstSegment.airline?.logo_url || airlineData?.logo;

                return (
                    <div >
                        <div
                            key={idx}
                            className={`${styles.legSection} ${idx < segmentGroups.length - 1 ? styles.legSectionDivider : ''}`}
                        >
                            <div className={styles.legHeader}>
                                <span className={`${styles.legBadge} ${getLegBadgeClass(flightDetails.trip_type, idx)}`}>
                                    <FaPlane size={9} />
                                    {group.label}
                                </span>
                                <span className={styles.legDate}>
                                    {moment(firstSegment.departure.datetime).format('ddd, DD MMM YYYY')}
                                </span>
                            </div>

                            <div className={styles.flightRow}>
                                <div className={styles.airlineCol}>
                                    <div className={styles.airlineInfo}>
                                        {logoSrc ? (
                                            <div className={styles.airlineLogoWrap}>
                                                <Image
                                                    src={logoSrc}
                                                    height={32}
                                                    width={32}
                                                    quality={50}
                                                    alt={firstSegment.airline.code}
                                                    className={styles.airlineLogo}
                                                />
                                            </div>
                                        ) : (
                                            <div className={styles.airlineLogoWrap}>
                                                <span className={styles.airlineCodeFallback}>{firstSegment.airline.code}</span>
                                            </div>
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
                                </div>

                                <div className={styles.routeCol}>
                                    <div className={styles.flightEndpoint}>
                                        <div className={styles.flightTime}>
                                            {moment(firstSegment.departure.datetime).format('LT')}
                                        </div>
                                        <div className={styles.airportCode}>{firstSegment.departure.airport_code}</div>
                                    </div>

                                    <div className={styles.flightMiddle}>
                                        <div className={styles.durationAboveLine}>{durationLabel}</div>
                                        <div className={styles.flightLineTrack}>
                                            <div className={styles.lineSegment} />
                                            <span className={styles.stopsPillOnLine}>{stopLabel}</span>
                                            <div className={styles.lineSegment} />
                                            <FaPlane className={styles.planeIconEnd} aria-hidden="true" />
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
                    </div>
                );
            })}
        </section >
    );
}
