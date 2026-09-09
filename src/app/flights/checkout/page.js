'use client'

import React, { useEffect, useState } from 'react'
import { useFlightStore } from '@/components/Store/FlightStore';
import Form from '@/components/Flights/Checkout/Form';
import FlightSummary from '@/components/Flights/Checkout/FlightSummary';
import FlightDetail from '@/components/Flights/FlightDetail';
import FlightReviewHero from '@/components/Flights/Checkout/FlightReviewHero';
import './checkout.css';

export const dynamic = 'force-dynamic';

export default function page() {
    const { selectedFlight } = useFlightStore();
    const [flightDetails, setFlightDetails] = useState({});
    const [flightDetailOpen, setFlightDetailOpen] = useState(false);

    useEffect(() => {
        setFlightDetails(selectedFlight);
    }, [selectedFlight])

    if (!flightDetails || !flightDetails.segments) {
        return (
            <div className="flight-checkout-page">
                <div className="container pt-5">
                    <div className="alert alert-warning" role="alert">
                        No flight selected. Please go back and select a flight.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flight-checkout-page">
            <div className="container pb-5">
                <div className="checkout-page-header">
                    <h1>Review Your Booking</h1>
                    <p>Verify your flight and passenger details.</p>
                </div>

                <div className="flight-review-hero-container">
                    <FlightReviewHero flightDetails={flightDetails} />
                    <button
                        type="button"
                        className="btn-flight-details"
                        onClick={() => setFlightDetailOpen(true)}
                    >
                        View Details
                    </button>
                </div>

                <div className="row g-4 flight-checkout-main-row">
                    <div className="col-lg-8 col-12 order-2 order-lg-1">
                        <div className="checkout-section-header">
                            <h2>Checkout</h2>
                            <p>Complete your booking — enter passenger and payment details</p>
                        </div>

                        <Form flightdata={flightDetails} />
                    </div>

                    <div className="col-lg-4 col-12 order-1 order-lg-2">
                        <div className="checkout-sidebar">
                            <FlightSummary flightDetails={flightDetails} />
                        </div>
                    </div>
                </div>
            </div>

            <FlightDetail
                flightdata={flightDetails}
                hideTrigger
                showFlights={flightDetailOpen}
                onClose={() => setFlightDetailOpen(false)}
            />
        </div>
    )
}
