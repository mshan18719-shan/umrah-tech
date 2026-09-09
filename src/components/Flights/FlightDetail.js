'use client'
import React, { useState, useEffect } from 'react'
import { Modal } from '@mantine/core';
import { FaAngleDown, FaSuitcase, FaPlane, FaChair, FaClock, FaShieldAlt, FaTv } from "react-icons/fa";
import { MdCancel, MdSwapHoriz } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { HiOutlineLocationMarker } from "react-icons/hi";
import moment from 'moment';
import { AirportList } from '@/util/AirportList';
import Image from 'next/image';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import styles from './FlightDetail.module.css';


export default function FlightDetail({ flightdata, outlineBtn, showFlights, onClose, hideTrigger = false, linkTrigger = false }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSize, setModalSize] = useState('100%');

    useEffect(() => {
        const updateSize = () => {
            setModalSize(window.innerWidth > 768 ? '56%' : '100%');
        };

        updateSize();
        window.addEventListener('resize', updateSize);

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (showFlights !== undefined) {
            setModalOpen(showFlights);
        }
    }, [showFlights])

    const handlemodalopenclose = () => {
        const next = !modalOpen;
        setModalOpen(next);
        if (!next && onClose) onClose();
    };

    const groupSegments = (flight) => {
        if (!flight || !flight.segments) return [];
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

    const getSectionLabel = (label) => {
        if (label === 'Departure') return 'Departure';
        if (label === 'Return') return 'Return';
        return label;
    };

    const getStopsLabel = (segments) => {
        const stops = segments.length - 1;
        if (stops <= 0) return 'Direct';
        return `${stops} ${stops === 1 ? 'Stop' : 'Stops'}`;
    };

    const getLegDurationMinutes = (segments) => {
        return segments.reduce((acc, seg, idx) => {
            let time = acc + seg.duration;
            const nextSeg = segments[idx + 1];
            if (nextSeg) {
                time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
            }
            return time;
        }, 0);
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatBaggageSummary = (segments) => {
        const firstWithBaggage = segments.find(s => s?.baggage_info?.adult);
        if (!firstWithBaggage) return null;
        const { cabin, checked } = firstWithBaggage.baggage_info.adult;
        const parts = [checked, cabin].filter(Boolean);
        return parts.length ? parts.join(' + ') : null;
    };

    const getAirportMeta = (airportCode, segmentFallback) => {
        const airport = AirportList.find(item => item.airportCode === airportCode);
        if (airport) {
            return `${airport.airportName} ${airport.cityName} ${airport.countryName}`;
        }
        return segmentFallback || airportCode;
    };

    const getAircraftLabel = (segment) => {
        return segment?.aircraft?.name
            || segment?.aircraft?.iata_code
            || segment?.aircraft_name
            || null;
    };

    const getLayoverLabel = (segment, nextSegment) => {
        const arrAirport = AirportList.find(airport => airport.airportCode === segment.arrival.airport_code);
        const layoverMinutes = moment(nextSegment.departure.datetime).diff(moment(segment.arrival.datetime), 'minutes');
        const city = arrAirport?.cityName || segment.arrival.city || segment.arrival.airport_code;
        const code = segment.arrival.airport_code;
        return `${formatDuration(layoverMinutes)} layover in ${city} (${code})`;
    };

    const renderPenalties = () => {
        if (!flightdata?.penalties) return null;

        return (
            <div className={styles.penaltiesSection}>
                <h6 className={styles.penaltiesTitle}>Cancellation & Change Policies</h6>
                <div className={styles.penaltiesGrid}>
                    {flightdata.penalties.refund_before_departure && (
                        <div className={styles.penaltyCard}>
                            <MdCancel className={styles.penaltyIcon} />
                            <div>
                                <span className={styles.penaltyLabel}>Cancellation Policy:</span>
                                {flightdata.penalties.refund_before_departure.allowed ? (
                                    <span className={`${styles.penaltyText} ${styles.textSuccess}`}>
                                        {flightdata.penalties.refund_before_departure.penalty_amount &&
                                            flightdata.penalties.refund_before_departure.penalty_currency ? (
                                            flightdata.penalties.refund_before_departure.penalty_amount > 0 ? (
                                                <>Cancellation allowed with a penalty fee of <strong><PriceDisplay price={flightdata.penalties.refund_before_departure.penalty_amount} currency={flightdata.penalties.refund_before_departure.penalty_currency} /></strong> before departure.</>
                                            ) : (
                                                <>Cancellation allowed at no additional cost before departure.</>
                                            )
                                        ) : (
                                            <>Cancellation allowed before departure.</>
                                        )}
                                    </span>
                                ) : (
                                    <span className={`${styles.penaltyText} ${styles.textDanger}`}>This ticket is <strong>non-refundable</strong>. Cancellations are not permitted.</span>
                                )}
                            </div>
                        </div>
                    )}

                    {flightdata.penalties.change_before_departure && (
                        <div className={styles.penaltyCard}>
                            <MdSwapHoriz className={styles.penaltyIcon} />
                            <div>
                                <span className={styles.penaltyLabel}>Change/Exchange Policy:</span>
                                {flightdata.penalties.change_before_departure.allowed ? (
                                    <span className={`${styles.penaltyText} ${styles.textSuccess}`}>
                                        {flightdata.penalties.change_before_departure.penalty_amount &&
                                            flightdata.penalties.change_before_departure.penalty_currency ? (
                                            flightdata.penalties.change_before_departure.penalty_amount > 0 ? (
                                                <>Changes allowed with a fee of <strong><PriceDisplay price={flightdata.penalties.change_before_departure.penalty_amount} currency={flightdata.penalties.change_before_departure.penalty_currency} /></strong> before departure.</>
                                            ) : (
                                                <>Changes allowed at no additional cost before departure.</>
                                            )
                                        ) : (
                                            <>Changes allowed before departure.</>
                                        )}
                                    </span>
                                ) : (
                                    <span className={`${styles.penaltyText} ${styles.textDanger}`}>Changes are <strong>not permitted</strong> for this ticket.</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderLegSection = (group, index) => {
        const firstSegment = group.segments[0];
        const lastSegment = group.segments[group.segments.length - 1];
        const baggageSummary = formatBaggageSummary(group.segments);
        const legDuration = getLegDurationMinutes(group.segments);
        const stopsLabel = getStopsLabel(group.segments);
        const dayDiff = moment(lastSegment.arrival.datetime).startOf('day').diff(
            moment(firstSegment.departure.datetime).startOf('day'), 'days'
        );
        const aircraftLabel = getAircraftLabel(firstSegment);
        const layoverSegment = group.segments.length > 1 ? group.segments[0] : null;
        const layoverNext = group.segments.length > 1 ? group.segments[1] : null;

        return (
            <div key={index} className={styles.legSection}>
                <div className={styles.airlineSummaryRow}>
                    <div className={styles.airlineSummaryLeft}>
                        {firstSegment.airline?.logo_url && (
                            <Image
                                src={firstSegment.airline.logo_url}
                                height={28}
                                width={28}
                                quality={100}
                                className={styles.airlineSummaryLogo}
                                alt={firstSegment.airline.code}
                            />
                        )}
                        <span className={styles.airlineSummaryName}>{firstSegment.airline.name}</span>
                    </div>
                    <span className={styles.legMeta}>
                        {stopsLabel} &bull; {formatDuration(legDuration)}
                    </span>
                </div>

                <div className={styles.sectionDivider}>
                    <span>{getSectionLabel(group.label)}</span>
                </div>

                <div className={styles.journeyCard}>
                    <div className={styles.journeyEndpoint}>
                        <div className={styles.endpointTop}>
                            <span className={styles.endpointIconDep} aria-hidden="true">
                                <FaPlane size={10} />
                            </span>
                            <span className={styles.endpointCode}>{firstSegment.departure.airport_code}</span>
                        </div>
                        <div className={styles.endpointTime}>
                            {moment(firstSegment.departure.datetime).format("DD MMM YYYY, hh:mm A")}
                        </div>
                        <div className={styles.endpointMeta}>
                            {getAirportMeta(firstSegment.departure.airport_code, firstSegment.departure.airport_code)}
                        </div>
                    </div>

                    <div className={styles.journeyMiddle}>
                        {aircraftLabel && (
                            <div className={styles.aircraftRow}>
                                <FaPlane className={styles.aircraftIcon} aria-hidden="true" />
                                <span>{aircraftLabel}</span>
                            </div>
                        )}
                        {layoverSegment && layoverNext && (
                            <div className={styles.layoverPill}>
                                <FaClock className={styles.layoverPillIcon} aria-hidden="true" />
                                <span>{getLayoverLabel(layoverSegment, layoverNext)}</span>
                            </div>
                        )}
                        {!layoverSegment && !aircraftLabel && (
                            <div className={styles.directLine} aria-hidden="true" />
                        )}
                    </div>

                    <div className={`${styles.journeyEndpoint} ${styles.journeyEndpointRight}`}>
                        <div className={styles.endpointTop}>
                            <span className={styles.endpointCode}>
                                {lastSegment.arrival.airport_code}
                                {dayDiff > 0 && <sup className={styles.dayOffset}>+{dayDiff}</sup>}
                            </span>
                            <span className={styles.endpointIconArr} aria-hidden="true">
                                <HiOutlineLocationMarker size={12} />
                            </span>
                        </div>
                        <div className={styles.endpointTime}>
                            {moment(lastSegment.arrival.datetime).format("DD MMM YYYY, hh:mm A")}
                        </div>
                        <div className={styles.endpointMeta}>
                            {getAirportMeta(lastSegment.arrival.airport_code, lastSegment.arrival.airport_code)}
                        </div>
                    </div>
                </div>

                <div className={styles.infoPills}>
                    <div className={styles.infoPill}>
                        <FaChair className={styles.infoPillIcon} aria-hidden="true" />
                        <span>{firstSegment.cabin_class?.name || 'Economy'}</span>
                    </div>
                    <div className={styles.infoPill}>
                        <FaSuitcase className={styles.infoPillIcon} aria-hidden="true" />
                        <span>{baggageSummary || 'See airline policy'}</span>
                    </div>
                    {/* <div className={styles.infoPill}>
                        <FaClock className={styles.infoPillIcon} aria-hidden="true" />
                        <span>Duration: {formatDuration(legDuration)}</span>
                    </div> */}
                    <div className={styles.infoPill}>
                        <FaPlane className={styles.infoPillIcon} aria-hidden="true" />
                        <span>Flight No: {firstSegment.airline.code}{firstSegment.flight_number}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {!hideTrigger && outlineBtn !== 'umrahgetaway' && (
                <div>
                    {outlineBtn ? (
                        <button onClick={() => setModalOpen(true)} className="btn btn-outline-secondary btn-sm me-2"><FaPlane /> {outlineBtn}</button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className={linkTrigger ? styles.detailsLinkTrigger : styles.detailsTrigger}
                        >
                            {linkTrigger ? (
                                <span className={styles.detailsLinkSpark} aria-hidden="true">✦</span>
                            ) : (
                                <FaPlane className={styles.detailsTriggerIcon} />
                            )}
                            <span>Flight Details</span>
                            <FaAngleDown className={linkTrigger ? styles.detailsLinkChevron : styles.detailsTriggerChevron} />
                        </button>
                    )}
                </div>
            )}
            <Modal
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
                opened={modalOpen}
                onClose={handlemodalopenclose}
                size={modalSize}
                centered
                withCloseButton={false}
                padding={0}
                radius="lg"
                lockScroll
                classNames={{
                    inner: styles.modalInner,
                    content: styles.modalContent,
                    body: styles.modalBody,
                }}
            >
                <div className={styles.modalWrapper}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <div className={styles.headerIcon}><FaPlane /></div>
                            <h2 className={styles.headerTitle}>Flight Details</h2>
                        </div>
                        <div className={styles.headerRight}>
                            <div className={styles.trustBadges}>
                                <span className={styles.trustBadge}>
                                    <FaShieldAlt className={styles.trustBadgeIcon} aria-hidden="true" />
                                    ATOL
                                </span>
                                <span className={styles.trustBadge}>
                                    <FaTv className={styles.trustBadgeIcon} aria-hidden="true" />
                                    IFE
                                </span>
                            </div>
                            <button type="button" onClick={handlemodalopenclose} className={styles.closeBtn} aria-label="Close">
                                <IoMdClose size={20} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.body}>
                        {groupSegments(flightdata).map((group, index) => renderLegSection(group, index))}
                        {renderPenalties()}
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.footerPrice}>
                            <span className={styles.footerPriceLabel}>Total Price</span>
                            <span className={styles.footerPriceValue}>
                                <PriceDisplay
                                    price={flightdata?.pricing?.total_amount}
                                    currency={flightdata?.pricing?.currency}
                                />
                            </span>
                            <span className={styles.footerPriceLabel}>Vat and Taxes included</span>
                        </div>
                        <button type="button" onClick={handlemodalopenclose} className={styles.footerCloseBtn}>
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
