'use client';

import React, { useMemo, useState } from 'react';
import {
    IoChevronForward,
    IoChevronUp,
    IoChevronDown,
    IoInformationCircleOutline,
} from 'react-icons/io5';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import PolicyModal from './PolicyModal';
import { useCurrency } from '@/util/currency';
import {
    groupSegments,
    getPassengerPricingRows,
    getTravelerPricingGroups,
    hasPerTravelerPricing,
    isNonRefundable,
} from './flightHelpers';
import styles from './FlightSummary.module.css';

function sumSeatPrices(selectedSeats = {}) {
    return Object.values(selectedSeats).reduce((sum, bySegment) => {
        return (
            sum +
            Object.values(bySegment || {}).reduce(
                (inner, seat) => inner + Number(seat?.seatPrice || seat?.price || 0),
                0
            )
        );
    }, 0);
}

function sumBaggagePrices(baggage = {}) {
    if (Array.isArray(baggage?.items) && baggage.items.length) {
        return baggage.items.reduce((sum, bag) => sum + Number(bag?.price || 0), 0);
    }

    const byPassenger = baggage?.byPassenger || {};
    return Object.values(byPassenger).reduce((sum, byLeg) => {
        return (
            sum +
            Object.values(byLeg || {}).reduce((inner, bag) => inner + Number(bag?.price || 0), 0)
        );
    }, 0);
}

function firstAncillaryCurrency(ancillarySelections, fallback) {
    const bags = ancillarySelections?.baggage?.items || [];
    if (bags[0]?.currency) return bags[0].currency;

    const byPassenger = ancillarySelections?.baggage?.byPassenger || {};
    for (const byLeg of Object.values(byPassenger)) {
        const bag = Object.values(byLeg || {})[0];
        if (bag?.currency) return bag.currency;
    }

    for (const bySegment of Object.values(ancillarySelections?.seats || {})) {
        const seat = Object.values(bySegment || {})[0];
        if (seat?.seatCurrency || seat?.currency) return seat.seatCurrency || seat.currency;
    }

    return fallback;
}

export default function FlightSummary({ flightDetails, ancillarySelections = null }) {
    const { currency: selectedCurrency, rates } = useCurrency();
    const [policyOpen, setPolicyOpen] = useState(false);
    const [priceExpanded, setPriceExpanded] = useState(true);
    const [taxExpanded, setTaxExpanded] = useState(false);
    const [expandedTravelers, setExpandedTravelers] = useState({
        adult: true,
        child: false,
        infant: false,
    });

    const segmentGroups = groupSegments(flightDetails);
    const nonRefundable = isNonRefundable(flightDetails);
    const showTravelerBreakdown = hasPerTravelerPricing(flightDetails);
    const travelerGroups = showTravelerBreakdown ? getTravelerPricingGroups(flightDetails) : [];
    const pricingRows = showTravelerBreakdown
        ? []
        : getPassengerPricingRows(flightDetails, selectedCurrency, rates);
    const pricing = flightDetails?.pricing;
    const taxAmount = (
        Number(pricing?.tax_amount || 0) + Number(pricing?.markup_details?.total_markup_amount || 0)
    ).toFixed(2);
    const baseTotal = Number(pricing?.total_amount || 0);
    const currency = pricing?.currency;

    const baggageTotal = useMemo(
        () => sumBaggagePrices(ancillarySelections?.baggage || {}),
        [ancillarySelections?.baggage]
    );
    const seatsTotal = useMemo(
        () => sumSeatPrices(ancillarySelections?.seats || {}),
        [ancillarySelections?.seats]
    );
    const addOnCurrency = firstAncillaryCurrency(ancillarySelections, currency);
    const totalAmount = baseTotal + baggageTotal + seatsTotal;

    const toggleTraveler = (key) => {
        setExpandedTravelers((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <aside className={styles.summary}>
            <div className={styles.fare}>
                {nonRefundable ? (
                    <div className={`${styles.status} ${styles.statusWarn}`}>
                        <span className={styles.statusDot} aria-hidden />
                        <span>
                            You are booking a <strong>non-refundable</strong> ticket
                        </span>
                    </div>
                ) : (
                    <div className={styles.status}>
                        <span className={styles.statusDot} aria-hidden />
                        <span>
                            You are booking a <strong>refundable</strong> ticket
                        </span>
                    </div>
                )}

                <button
                    type="button"
                    className={styles.policyBtn}
                    onClick={() => setPolicyOpen(true)}
                >
                    <span className={styles.policyIconWrap}>
                        <IoInformationCircleOutline aria-hidden />
                    </span>
                    <span className={styles.policyText}>Baggage &amp; Cancellation Policy</span>
                    <IoChevronForward className={styles.policyChevron} aria-hidden />
                </button>

                <div className={styles.fareDivider} aria-hidden />

                <button
                    type="button"
                    className={styles.fareHeader}
                    onClick={() => setPriceExpanded((prev) => !prev)}
                    aria-expanded={priceExpanded}
                >
                    <span className={styles.fareHeaderLeft}>
                        <span className={styles.fareLabel}>Total price</span>
                        {priceExpanded ? (
                            <IoChevronUp className={styles.chevron} aria-hidden />
                        ) : (
                            <IoChevronDown className={styles.chevron} aria-hidden />
                        )}
                    </span>
                    <span className={styles.fareHeaderRight}>
                        <span className={styles.fareTotal}>
                            <PriceDisplay currency={currency || addOnCurrency} price={totalAmount} />
                        </span>
                        <span className={styles.fareNote}>Included VAT and TAX</span>
                    </span>
                </button>

                {priceExpanded && (
                    <div className={styles.fareBody}>
                        {showTravelerBreakdown && travelerGroups.length > 0 ? (
                            travelerGroups.map((group) => {
                                const isOpen = expandedTravelers[group.key] !== false;

                                return (
                                    <div key={group.key} className={styles.travelerGroup}>
                                        <button
                                            type="button"
                                            className={styles.row}
                                            onClick={() => toggleTraveler(group.key)}
                                            aria-expanded={isOpen}
                                        >
                                            <span className={styles.rowLabel}>{group.label}</span>
                                            <i className={styles.leader} aria-hidden />
                                            <span className={styles.rowAmount}>
                                                <PriceDisplay
                                                    currency={group.currency}
                                                    price={group.total}
                                                />
                                            </span>
                                            {isOpen ? (
                                                <IoChevronUp className={styles.chevron} aria-hidden />
                                            ) : (
                                                <IoChevronDown className={styles.chevron} aria-hidden />
                                            )}
                                        </button>

                                        {isOpen && (
                                            <div className={styles.details}>
                                                {group.fare > 0 && (
                                                    <div className={styles.detailRow}>
                                                        <span>Flight fare</span>
                                                        <i className={styles.leader} aria-hidden />
                                                        <span className={styles.detailAmount}>
                                                            <PriceDisplay
                                                                currency={group.currency}
                                                                price={group.fare}
                                                            />
                                                        </span>
                                                    </div>
                                                )}
                                                {group.tax > 0 && (
                                                    <div className={styles.detailRow}>
                                                        <span>Airline taxes and fees</span>
                                                        <i className={styles.leader} aria-hidden />
                                                        <span className={styles.detailAmount}>
                                                            <PriceDisplay
                                                                currency={group.currency}
                                                                price={group.tax}
                                                            />
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <>
                                {pricingRows.map((row) => (
                                    <div key={row.key} className={`${styles.row} ${styles.rowStatic}`}>
                                        <span className={styles.rowLabel}>{row.label}</span>
                                        <i className={styles.leader} aria-hidden />
                                        <span className={styles.rowAmount}>
                                            <PriceDisplay currency={row.currency} price={row.amount} />
                                        </span>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className={styles.row}
                                    onClick={() => setTaxExpanded((prev) => !prev)}
                                    aria-expanded={taxExpanded}
                                >
                                    <span className={styles.rowLabel}>Total Tax</span>
                                    <i className={styles.leader} aria-hidden />
                                    <span className={styles.rowAmount}>
                                        <PriceDisplay currency={currency} price={taxAmount} />
                                    </span>
                                    {taxExpanded ? (
                                        <IoChevronUp className={styles.chevron} aria-hidden />
                                    ) : (
                                        <IoChevronDown className={styles.chevron} aria-hidden />
                                    )}
                                </button>

                                {taxExpanded && (
                                    <p className={styles.taxNote}>
                                        Taxes and surcharges included in the total fare as charged by the
                                        airline and authorities.
                                    </p>
                                )}
                            </>
                        )}

                        {(baggageTotal > 0 || seatsTotal > 0) && (
                            <div className={styles.addons}>
                                {baggageTotal > 0 && (
                                    <div className={`${styles.row} ${styles.rowStatic}`}>
                                        <span className={styles.rowLabel}>Extra baggage</span>
                                        <i className={styles.leader} aria-hidden />
                                        <span className={styles.rowAmount}>
                                            <PriceDisplay
                                                currency={addOnCurrency || currency}
                                                price={baggageTotal}
                                            />
                                        </span>
                                    </div>
                                )}

                                {seatsTotal > 0 && (
                                    <div className={`${styles.row} ${styles.rowStatic}`}>
                                        <span className={styles.rowLabel}>Seats</span>
                                        <i className={styles.leader} aria-hidden />
                                        <span className={styles.rowAmount}>
                                            <PriceDisplay
                                                currency={addOnCurrency || currency}
                                                price={seatsTotal}
                                            />
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={styles.feeRow}>
                            <span className={styles.rowLabel}>Booking Fee</span>
                            <i className={styles.leader} aria-hidden />
                            <span className={styles.feeFree}>Free</span>
                        </div>
                    </div>
                )}
            </div>

            <PolicyModal
                opened={policyOpen}
                onClose={() => setPolicyOpen(false)}
                flightDetails={flightDetails}
                segmentGroups={segmentGroups}
                ancillarySelections={ancillarySelections}
            />
        </aside>
    );
}
