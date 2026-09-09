'use client';

import React, { useState } from 'react';
import { IoInformationCircleOutline, IoLockClosedOutline } from 'react-icons/io5';
import PriceDisplay from '@/components/Currency/PriceDisplay';
// import FlightDetail from '@/components/Flights/FlightDetail';
import PolicyModal from './PolicyModal';
import { useCurrency } from '@/util/currency';
import {
    groupSegments,
    getPassengerPricingRows,
} from './flightHelpers';

export default function FlightSummary({ flightDetails }) {
    const { currency: selectedCurrency, rates } = useCurrency();
    const [policyOpen, setPolicyOpen] = useState(false);

    const segmentGroups = groupSegments(flightDetails);
    const pricingRows = getPassengerPricingRows(flightDetails, selectedCurrency, rates);
    const pricing = flightDetails?.pricing;
    const taxAmount = Number(pricing?.tax_amount || 0) + Number(pricing?.markup_details?.total_markup_amount || 0);
    const totalAmount = Number(pricing?.total_amount || 0);
    const currency = pricing?.currency;

  /* Flight route cards commented out — details shown in FlightReviewHero above
    const nonRefundable = isNonRefundable(flightDetails);
    const passengerLabel = getCompactPassengerLabel(flightDetails);

    {segmentGroups.map((group, index) => {
        const firstSegment = group.segments[0];
        const lastSegment = group.segments[group.segments.length - 1];

        return (
            <div key={index} className={styles.flightCard}>
                {index === 0 && !nonRefundable ? (
                    <div className={styles.refundBanner}>
                        You are booking a <strong>non-refundable</strong> ticket
                    </div>
                ) : (
                    <div className={`${styles.refundBanner} ${styles.refundBannersuccess}`}>
                        You are booking a <strong>refundable</strong> ticket
                    </div>
                )}

                <button
                    type="button"
                    className={styles.routeRow}
                    onClick={() => setFlightDetailOpen(true)}
                    aria-label={`View ${group.label} flight details`}
                >
                    <div className={styles.routeInfo}>
                        <p className={styles.routeText}>
                            {firstSegment.departure.city} ({firstSegment.departure.airport_code}) →{' '}
                            {lastSegment.arrival.city} ({lastSegment.arrival.airport_code})
                        </p>
                        <p className={styles.routeMeta}>
                            {formatRouteDate(firstSegment.departure.datetime)}
                            {passengerLabel && ` · ${passengerLabel}`}
                        </p>
                    </div>
                    <IoChevronForward className={styles.routeChevron} aria-hidden />
                </button>

                {index === segmentGroups.length - 1 && (
                    <>
                        <div className={styles.cardDividerDashed} />
                        <button
                            type="button"
                            className={styles.policyLink}
                            onClick={() => setPolicyOpen(true)}
                        >
                            <IoInformationCircleOutline className={styles.policyIcon} aria-hidden />
                            Baggage &amp; Cancellation Policy
                        </button>
                    </>
                )}
            </div>
        );
    })}
  */

    return (
        <aside>
            <div className="summary-card">
                <div className="summary-card-header">
                    <h5>Order Summary</h5>
                </div>
                <div className="summary-card-body">
                    {pricingRows.map((row) => (
                        <div key={row.key} className="summary-line">
                            <span className="line-label">{row.label}</span>
                            <span className="line-value">
                                <PriceDisplay currency={row.currency} price={row.amount} />
                            </span>
                        </div>
                    ))}

                    <div className="summary-line">
                        <span className="line-label">Total Tax</span>
                        <span className="line-value">
                            <PriceDisplay currency={currency} price={taxAmount} />
                        </span>
                    </div>

                    <div className="summary-line">
                        <span className="line-label">Booking Fee</span>
                        <span className="line-value summary-free-text">Free</span>
                    </div>

                    <hr className="summary-divider" />

                    <div className="summary-total-row">
                        <span className="total-label">Total</span>
                        <span className="total-value">
                            <PriceDisplay currency={currency} price={totalAmount} />
                        </span>
                    </div>
                    <p className="summary-tax-note">VAT and taxes included</p>

                    <button
                        type="button"
                        className="btn-flight-policy-link"
                        onClick={() => setPolicyOpen(true)}
                    >
                        <IoInformationCircleOutline size={16} aria-hidden />
                        Baggage &amp; Cancellation Policy
                    </button>

                    <div className="summary-secure-note">
                        <IoLockClosedOutline />
                        ATOL Protected — Secure Checkout
                    </div>
                </div>
            </div>

            {/* <FlightDetail
                flightdata={flightDetails}
                hideTrigger
                showFlights={flightDetailOpen}
                onClose={() => setFlightDetailOpen(false)}
            /> */}

            <PolicyModal
                opened={policyOpen}
                onClose={() => setPolicyOpen(false)}
                flightDetails={flightDetails}
                segmentGroups={segmentGroups}
            />
        </aside>
    );
}
