'use client';
import React from 'react';
import { Modal } from '@mantine/core';
import moment from 'moment';
import Image from 'next/image';
import { FaPlane } from 'react-icons/fa';
import { FiCheckCircle } from 'react-icons/fi';
import airline from '@/util/airlines.json';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import styles from './FlightCompareModal.module.css';

const groupSegments = (flight) => {
    if (!flight?.segments?.length) return [];

    if (flight.trip_type === 'return') {
        const legs = flight?.search_criteria?.legs || [];
        if (legs.length === 0) {
            const midpoint = Math.ceil(flight.segments.length / 2);
            return [
                { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
                { segments: flight.segments.slice(midpoint), label: 'Return' },
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

const renderFlightLegs = (flight) => {
    const segmentGroups = groupSegments(flight);

    return segmentGroups.map((group, idx) => {
        const firstSegment = group.segments[0];
        const lastSegment = group.segments[group.segments.length - 1];
        const totalTime = group.segments.reduce((acc, seg, segIdx) => {
            let time = acc + (seg.duration || 0);
            const nextSeg = group.segments[segIdx + 1];
            if (nextSeg) {
                time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
            }
            return time;
        }, 0);
        const airlineData = airline.find((a) => a.iata === firstSegment?.airline?.code);
        const logoSrc = firstSegment?.airline?.logo_url || airlineData?.logo;
        const isDirect = group.segments.length === 1 && group.segments[0]?.stops === 0;
        const stopLabel = isDirect
            ? 'Direct'
            : `${group.segments.length - 1} ${group.segments.length - 1 === 1 ? 'stop' : 'stops'}`;
        const dayDiff = moment(lastSegment?.arrival?.datetime).startOf('day').diff(
            moment(firstSegment?.departure?.datetime).startOf('day'),
            'days'
        );

        return (
            <div key={idx} className={styles.legBlock}>
                <div className={styles.legHeader}>
                    <span className={`${styles.legBadge} ${idx === 0 ? styles.legBadgeDeparture : styles.legBadgeReturn}`}>
                        <FaPlane size={8} />
                        {group.label}
                    </span>
                    <span className={styles.legDate}>
                        {moment(firstSegment?.departure?.datetime).format('ddd, DD MMM YYYY')}
                    </span>
                </div>
                <div className={styles.legBody}>
                    <div className={styles.airlineInfo}>
                        {logoSrc && (
                            <div className={styles.airlineLogoWrap}>
                                <Image
                                    src={logoSrc}
                                    height={24}
                                    width={24}
                                    alt={firstSegment?.airline?.code || 'airline'}
                                    className={styles.airlineLogo}
                                    unoptimized
                                />
                            </div>
                        )}
                        <div className={styles.airlineText}>
                            <span className={styles.airlineName}>
                                {firstSegment?.airline?.name || airlineData?.name || firstSegment?.airline?.code}
                            </span>
                            <span className={styles.cabinClass}>
                                {firstSegment?.cabin_class?.name || 'Economy'}
                            </span>
                        </div>
                    </div>
                    <div className={styles.routeInfo}>
                        <div className={styles.endpoint}>
                            <div className={styles.flightTime}>
                                {moment(firstSegment?.departure?.datetime).format('HH:mm')}
                            </div>
                            <div className={styles.airportCode}>{firstSegment?.departure?.airport_code}</div>
                        </div>
                        <div className={styles.routeMiddle}>
                            <span className={`${styles.stopsPill} ${isDirect ? styles.stopsPillDirect : styles.stopsPillStops}`}>
                                {stopLabel}
                            </span>
                            <span className={styles.duration}>
                                {Math.floor(totalTime / 60)}h {totalTime % 60}m
                            </span>
                        </div>
                        <div className={styles.endpoint}>
                            <div className={styles.flightTime}>
                                {moment(lastSegment?.arrival?.datetime).format('HH:mm')}
                                {dayDiff > 0 && <sup className={styles.dayOffset}>+{dayDiff}</sup>}
                            </div>
                            <div className={styles.airportCode}>{lastSegment?.arrival?.airport_code}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    });
};

export default function FlightCompareModal({
    opened,
    onClose,
    originalFlight,
    newFlight,
    pkg,
    onUpdateFlight,
    isUpdating = false,
}) {
    const currentFlightPrice = Number(
        pkg?.pricing?.flight_price ?? originalFlight?.pricing?.total_amount ?? 0
    );
    const currentCurrency = pkg?.pricing?.currency || originalFlight?.pricing?.currency;
    const newFlightPrice = Number(newFlight?.pricing?.total_amount ?? 0);
    const newCurrency = newFlight?.pricing?.currency || currentCurrency;

    const priceDiff = newFlightPrice - currentFlightPrice;
    const totalPax = (pkg?.original_request?.adult || 0) + (pkg?.original_request?.child || 0);

    const getDiffStyle = () => {
        if (priceDiff > 0) return styles.priceDiffIncrease;
        if (priceDiff < 0) return styles.priceDiffDecrease;
        return styles.priceDiffSame;
    };

    const getDiffLabel = () => {
        if (priceDiff > 0) return 'Total Extra Cost';
        if (priceDiff < 0) return 'Total savings';
        return 'No price change';
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <div className={styles.confirmHeader}>
                    <div className={styles.confirmIcon}><FiCheckCircle size={18} /></div>
                    <h2 className={styles.confirmTitle}>Confirm Flight Selection</h2>
                </div>
            }
            centered
            size="lg"
            radius={16}
            padding={0}
            transitionProps={{ transition: 'pop', duration: 200 }}
            zIndex={300}
            classNames={{
                content: styles.modalContent,
                header: styles.modalHeader,
                body: styles.modalBody,
            }}
        >
            {newFlight && (
                <div className={styles.compareStack}>
                    {originalFlight && (
                        <>
                            <div className={`${styles.compareCard} ${styles.compareCurrent}`}>
                                <div className={`${styles.compareLabel} ${styles.compareLabelCurrent}`}>Current Flight</div>
                                {renderFlightLegs(originalFlight)}
                                <div className={styles.priceSection}>
                                    <div className={styles.compareRow}>
                                        <span>Flight price</span>
                                        <strong className={styles.priceValueCurrent}>
                                            <PriceDisplay price={currentFlightPrice} currency={currentCurrency} />
                                        </strong>
                                    </div>
                                    {totalPax > 0 && (
                                        <div className={styles.compareRow}>
                                            <span>Per person</span>
                                            <strong>
                                                <PriceDisplay price={currentFlightPrice / totalPax} currency={currentCurrency} />
                                            </strong>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.compareVs}>vs</div>
                        </>
                    )}

                    <div className={`${styles.compareCard} ${styles.compareNew}`}>
                        <div className={`${styles.compareLabel} ${styles.compareLabelNew}`}>New Flight</div>
                        {renderFlightLegs(newFlight)}
                        <div className={styles.priceSection}>
                            <div className={styles.compareRow}>
                                <span>Flight price</span>
                                <strong className={styles.priceValueNew}>
                                    <PriceDisplay price={newFlightPrice} currency={newCurrency} />
                                </strong>
                            </div>
                            {totalPax > 0 && (
                                <div className={styles.compareRow}>
                                    <span>Per person</span>
                                    <strong>
                                        <PriceDisplay price={newFlightPrice / totalPax} currency={newCurrency} />
                                    </strong>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${styles.priceDiffBox} ${getDiffStyle()}`}>
                        <span>{getDiffLabel()}</span>
                        <strong>
                            <PriceDisplay
                                price={priceDiff === 0 ? '0' : (priceDiff > 0 ? `+${priceDiff.toFixed(2)}` : priceDiff.toFixed(2))}
                                currency={newCurrency}
                            />
                        </strong>
                    </div>

                    <div className={styles.confirmActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={styles.updateBtn}
                            disabled={isUpdating}
                            onClick={onUpdateFlight}
                        >
                            <FiCheckCircle size={15} />
                            {isUpdating ? 'Updating...' : 'Update Flight'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
