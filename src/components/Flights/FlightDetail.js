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
import { groupSegments } from './Checkout/flightHelpers';

const PASSENGER_TYPES = [
    { key: 'adult', label: 'Adult' },
    { key: 'child', label: 'Child' },
    { key: 'infant', label: 'Infant' },
];

const POLICY_FIELDS = [
    { key: 'change_before_departure', label: 'Change before departure', kind: 'change' },
    { key: 'change_after_departure', label: 'Change after departure', kind: 'change' },
    { key: 'refund_before_departure', label: 'Refund before departure', kind: 'refund' },
    { key: 'refund_after_departure', label: 'Refund after departure', kind: 'refund' },
];

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

    const getSegmentIndexes = (segments) => {
        const allSegments = flightdata?.segments || [];
        return segments
            .map((seg) => allSegments.indexOf(seg))
            .filter((idx) => idx >= 0);
    };

    const matchesSegmentList = (segmentIndexList, segmentIndexes) => {
        if (!Array.isArray(segmentIndexList) || !segmentIndexList.length) return true;
        const zeroBased = new Set(segmentIndexes);
        const oneBased = new Set(segmentIndexes.map((idx) => idx + 1));
        return segmentIndexList.some((idx) => zeroBased.has(idx) || oneBased.has(idx));
    };

    const pickPassengerEntry = (entries, segmentIndexes, legIndex = 0) => {
        if (!entries) return null;
        if (!Array.isArray(entries)) return entries;
        if (!entries.length) return null;

        const matched = entries.find((entry) =>
            Array.isArray(entry?.segment_index_list)
            && entry.segment_index_list.length
            && matchesSegmentList(entry.segment_index_list, segmentIndexes)
        );
        if (matched) return matched;

        const hasSegmentLists = entries.some(
            (entry) => Array.isArray(entry?.segment_index_list) && entry.segment_index_list.length
        );
        if (hasSegmentLists) return null;

        const firstSegIdx = segmentIndexes[0];
        if (firstSegIdx != null && entries[firstSegIdx]) return entries[firstSegIdx];
        if (entries[legIndex]) return entries[legIndex];
        return entries[0];
    };

    const getBaggageSource = (segments) => {
        const fromSegment = segments.find((seg) => seg?.baggage_info)?.baggage_info;
        return fromSegment || flightdata?.baggage_info || null;
    };

    const formatBaggageText = (bag) => {
        if (!bag || typeof bag !== 'object') return null;
        const parts = [bag.checked, bag.cabin].filter(Boolean);
        return parts.length ? parts.join(' + ') : null;
    };

    const getBaggageRows = (segments, legIndex = 0) => {
        const baggageInfo = getBaggageSource(segments);
        if (!baggageInfo) return [];

        const segmentIndexes = getSegmentIndexes(segments);

        return PASSENGER_TYPES.map(({ key, label }) => {
            const entry = pickPassengerEntry(baggageInfo[key], segmentIndexes, legIndex);
            const text = formatBaggageText(entry);
            if (!text) return null;
            return { key, label, text };
        }).filter(Boolean);
    };

    const isAllowed = (policy) => {
        if (!policy) return false;
        const value = policy.allowed;
        return value === true || value === 'true' || value === 1 || value === '1';
    };

    const formatPolicyValue = (policy, kind) => {
        if (!isAllowed(policy)) {
            return {
                status: 'denied',
                text: kind === 'refund' ? 'Not refundable' : 'Not permitted',
            };
        }

        const amount = Number(policy.penalty_amount);
        const hasCharge = policy.penalty_amount != null
            && policy.penalty_currency
            && !Number.isNaN(amount)
            && amount > 0;

        if (hasCharge) {
            return {
                status: 'charged',
                amount: policy.penalty_amount,
                currency: policy.penalty_currency,
            };
        }

        return { status: 'free', text: 'Free' };
    };

    const hasPassengerPenalties = (penalties) => {
        if (!penalties || typeof penalties !== 'object') return false;
        return PASSENGER_TYPES.some(({ key }) => Array.isArray(penalties[key]) || (penalties[key] && typeof penalties[key] === 'object' && !Array.isArray(penalties[key]) && (penalties[key].refund_before_departure || penalties[key].change_before_departure)));
    };

    const getFlatPolicies = (penalties) => {
        if (!penalties) return [];
        return POLICY_FIELDS
            .filter(({ key }) => penalties[key])
            .map(({ key, label, kind }) => ({
                key,
                label,
                kind,
                value: formatPolicyValue(penalties[key], kind),
            }));
    };

    const getPassengerPoliciesForLeg = (segmentIndexes, legIndex = 0) => {
        const penalties = flightdata?.penalties;
        if (!penalties) return [];

        return PASSENGER_TYPES.map(({ key, label }) => {
            const entry = pickPassengerEntry(penalties[key], segmentIndexes, legIndex);
            if (!entry) return null;

            const policies = POLICY_FIELDS
                .filter(({ key: policyKey }) => entry[policyKey] != null)
                .map(({ key: policyKey, label: policyLabel, kind }) => ({
                    key: policyKey,
                    label: policyLabel,
                    kind,
                    value: formatPolicyValue(entry[policyKey], kind),
                }));

            if (!policies.length) return null;
            return { key, label, policies };
        }).filter(Boolean);
    };

    const renderPolicyValue = (value) => {
        if (value.status === 'free') {
            return <span className={`${styles.policyValue} ${styles.textSuccess}`}>{value.text}</span>;
        }
        if (value.status === 'charged') {
            return (
                <span className={`${styles.policyValue} ${styles.textSuccess}`}>
                    Fee of{' '}
                    <strong>
                        <PriceDisplay price={value.amount} currency={value.currency} />
                    </strong>
                </span>
            );
        }
        return <span className={`${styles.policyValue} ${styles.textDanger}`}>{value.text}</span>;
    };

    const renderPolicyRows = (policies) => (
        <div className={styles.policyRows}>
            {policies.map((policy) => (
                <div key={policy.key} className={styles.policyRow}>
                    <span className={styles.policyRowLabel}>
                        {policy.kind === 'refund' ? (
                            <MdCancel className={styles.policyRowIcon} aria-hidden="true" />
                        ) : (
                            <MdSwapHoriz className={styles.policyRowIcon} aria-hidden="true" />
                        )}
                        {policy.label}
                    </span>
                    {renderPolicyValue(policy.value)}
                </div>
            ))}
        </div>
    );

    const renderLegPolicies = (group, legIndex) => {
        const penalties = flightdata?.penalties;
        if (!penalties) return null;

        const segmentIndexes = getSegmentIndexes(group.segments);
        const sectionLabel = getSectionLabel(group.label);

        if (hasPassengerPenalties(penalties)) {
            const passengerPolicies = getPassengerPoliciesForLeg(segmentIndexes, legIndex);
            if (!passengerPolicies.length) return null;

            return (
                <div className={styles.legPolicies}>
                    <h6 className={styles.penaltiesTitle}>
                        Cancellation & Change Policies — {sectionLabel}
                    </h6>
                    <div className={styles.passengerPolicyList}>
                        {passengerPolicies.map((passenger) => (
                            <div key={passenger.key} className={styles.passengerPolicyCard}>
                                <div className={styles.passengerPolicyHeader}>{passenger.label}</div>
                                {renderPolicyRows(passenger.policies)}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Flat (legacy) penalties apply to the whole ticket — show once under the first leg
        if (legIndex !== 0) return null;

        const flatPolicies = getFlatPolicies(penalties);
        if (!flatPolicies.length) return null;

        return (
            <div className={styles.legPolicies}>
                <h6 className={styles.penaltiesTitle}>Cancellation & Change Policies</h6>
                <div className={styles.passengerPolicyCard}>
                    {renderPolicyRows(flatPolicies)}
                </div>
            </div>
        );
    };

    const renderLegSection = (group, index) => {
        const firstSegment = group.segments[0];
        const lastSegment = group.segments[group.segments.length - 1];
        const baggageRows = getBaggageRows(group.segments, index);
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
                        <FaPlane className={styles.infoPillIcon} aria-hidden="true" />
                        <span>Flight No: {firstSegment.airline.code}{firstSegment.flight_number}</span>
                    </div>
                </div>

                {baggageRows.length > 0 && (
                    <div className={styles.baggageList}>
                        {baggageRows.map((row) => (
                            <div key={row.key} className={styles.baggageItem}>
                                <FaSuitcase className={styles.baggageIcon} aria-hidden="true" />
                                <span className={styles.baggageLabel}>{row.label}</span>
                                <span className={styles.baggageText}>{row.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                {renderLegPolicies(group, index)}
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
                zIndex={2000}
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
