'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useFlightStore } from '@/components/Store/FlightStore'
import Form from '@/components/Flights/Checkout/Form'
import AdditionalDetail from '@/components/Flights/Checkout/AdditionalDetail'
import CheckoutStepper from '@/components/Flights/Checkout/CheckoutStepper'
import FlightReviewHero from '@/components/Flights/Checkout/FlightReviewHero'
import OverviewDetails from '@/components/Flights/Checkout/OverviewDetails'
import FlightSummary from '@/components/Flights/Checkout/FlightSummary'
import FlightCheckoutTimer from '@/components/Flights/Checkout/FlightCheckoutTimer'
import styles from './checkout.module.css'

export const dynamic = 'force-dynamic'

function buildCheckoutSteps(flightDetails, ancillaryStatus) {
    const steps = [{ id: 'passengers', label: 'Passenger Detail' }]

    // Only show after pricing API confirms real options (never provisional from flags)
    if (ancillaryStatus?.ready && ancillaryStatus.baggage === true) {
        steps.push({ id: 'luggage', label: 'Baggage' })
    }
    if (ancillaryStatus?.ready && ancillaryStatus.seats === true) {
        steps.push({ id: 'seats', label: 'Seats' })
    }

    steps.push({ id: 'overview', label: 'Overview and Pay' })
    return steps
}

export default function CheckoutPage() {
    const { selectedFlight } = useFlightStore()
    const [ready, setReady] = useState(false)
    const [flightDetails, setFlightDetails] = useState({})
    const [checkoutPassengers, setCheckoutPassengers] = useState([])
    const [ancillarySelections, setAncillarySelections] = useState(null)
    const [ancillaryStatus, setAncillaryStatus] = useState({
        ready: false,
        baggage: false,
        seats: false,
    })
    const [currentStepId, setCurrentStepId] = useState('passengers')
    const [completedStepIds, setCompletedStepIds] = useState([])
    const [checkoutExpired, setCheckoutExpired] = useState(false)
    const [pendingPassengerContinue, setPendingPassengerContinue] = useState(false)

    useEffect(() => {
        const markReady = () => setReady(true)
        if (useFlightStore.persist?.hasHydrated?.()) {
            markReady()
        }
        const unsub = useFlightStore.persist?.onFinishHydration?.(markReady)
        return () => {
            if (typeof unsub === 'function') unsub()
        }
    }, [])

    useEffect(() => {
        if (!ready) return
        if (!selectedFlight?.id) {
            setFlightDetails({})
            return
        }
        setFlightDetails(selectedFlight)
    }, [selectedFlight, ready])

    useEffect(() => {
        if (!selectedFlight?.id) return
        setCheckoutExpired(false)
        setAncillaryStatus({ ready: false, baggage: false, seats: false })
        setAncillarySelections(null)
        setPendingPassengerContinue(false)
        setCurrentStepId('passengers')
        setCompletedStepIds([])
    }, [selectedFlight?.id])

    const mayHaveAncillary =
        flightDetails?.ancillary_availability?.paid_bag === true ||
        flightDetails?.ancillary_availability?.paid_seat === true

    useEffect(() => {
        if (!flightDetails?.id) return
        if (!mayHaveAncillary) {
            setAncillaryStatus({ ready: true, baggage: false, seats: false })
        }
    }, [flightDetails?.id, mayHaveAncillary])

    const steps = useMemo(
        () => buildCheckoutSteps(flightDetails, ancillaryStatus),
        [flightDetails, ancillaryStatus]
    )
    const hasLuggage = steps.some((s) => s.id === 'luggage')

    useEffect(() => {
        if (!steps.some((s) => s.id === currentStepId)) {
            const fallback =
                completedStepIds.includes('passengers') ||
                    currentStepId === 'luggage' ||
                    currentStepId === 'seats'
                    ? steps.find((s) => s.id === 'overview')?.id || steps[0]?.id
                    : steps[0]?.id || 'passengers'
            setCurrentStepId(fallback)
        }
    }, [steps, currentStepId, completedStepIds])

    useEffect(() => {
        if (!ancillaryStatus.ready) return

        if (currentStepId === 'luggage' && !ancillaryStatus.baggage) {
            setCurrentStepId(ancillaryStatus.seats ? 'seats' : 'overview')
            return
        }
        if (currentStepId === 'seats' && !ancillaryStatus.seats) {
            setCurrentStepId('overview')
        }
    }, [ancillaryStatus, currentStepId])

    const markCompleted = useCallback((stepId) => {
        setCompletedStepIds((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]))
    }, [])

    const goToStep = useCallback((stepId) => {
        setCurrentStepId(stepId)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [])

    const goNextFrom = useCallback(
        (stepId) => {
            markCompleted(stepId)
            const index = steps.findIndex((s) => s.id === stepId)
            const next = steps[index + 1]
            if (next) goToStep(next.id)
        },
        [steps, markCompleted, goToStep]
    )

    useEffect(() => {
        if (!pendingPassengerContinue) return
        if (mayHaveAncillary && !ancillaryStatus.ready) return
        setPendingPassengerContinue(false)
        goNextFrom('passengers')
    }, [pendingPassengerContinue, mayHaveAncillary, ancillaryStatus.ready, goNextFrom])

    const goBackFrom = useCallback(
        (stepId) => {
            const index = steps.findIndex((s) => s.id === stepId)
            const prev = steps[index - 1]
            if (prev) goToStep(prev.id)
        },
        [steps, goToStep]
    )

    const handleStepClick = (stepId) => {
        const targetIndex = steps.findIndex((s) => s.id === stepId)
        const currentIndex = steps.findIndex((s) => s.id === currentStepId)
        if (targetIndex <= currentIndex || completedStepIds.includes(stepId)) {
            goToStep(stepId)
        }
    }

    const handlePassengersChange = useCallback((nextPassengers) => {
        setCheckoutPassengers((prev) => {
            try {
                if (prev && JSON.stringify(prev) === JSON.stringify(nextPassengers)) return prev
            } catch (_) {
                /* ignore */
            }
            return nextPassengers
        })
    }, [])

    const handleSelectionsChange = useCallback((payload) => {
        setAncillarySelections((prev) => {
            try {
                if (prev && JSON.stringify(prev) === JSON.stringify(payload)) return prev
            } catch (_) {
                /* ignore */
            }
            return payload
        })
    }, [])

    const handleAvailabilityChange = useCallback((status) => {
        setAncillaryStatus((prev) => {
            const next = {
                ready: Boolean(status?.ready),
                baggage: Boolean(status?.baggage),
                seats: Boolean(status?.seats),
            }
            try {
                if (
                    prev.ready === next.ready &&
                    prev.baggage === next.baggage &&
                    prev.seats === next.seats
                ) {
                    return prev
                }
            } catch (_) {
                /* ignore */
            }
            return next
        })
    }, [])

    const handleCheckoutExpire = useCallback(() => {
        setCheckoutExpired(true)
    }, [])

    if (!ready) {
        return (
            <div className="container my-5">
                <div className="alert alert-light border text-center" role="status">
                    Loading flight details…
                </div>
            </div>
        )
    }

    if (!flightDetails || !flightDetails.segments) {
        return (
            <div className="container my-5">
                <div className="alert alert-warning" role="alert">
                    No flight selected. Please go back and select a flight.
                </div>
            </div>
        )
    }

    const showForm = currentStepId === 'passengers' || currentStepId === 'overview'
    const showAncillary = currentStepId === 'luggage' || currentStepId === 'seats'

    return (
        <div className="container my-5">
            <CheckoutStepper
                steps={steps}
                currentStepId={currentStepId}
                completedStepIds={completedStepIds}
                onStepClick={checkoutExpired ? undefined : handleStepClick}
            />

            {showForm && (
                <div className={styles.heroFullWidth}>
                    <FlightReviewHero flightDetails={flightDetails} />
                </div>
            )}

            <div className="row">
                <div className="col-lg-8 col-md-7 order-2 order-lg-1">
                    {currentStepId !== 'passengers' && !checkoutExpired && (
                        <button
                            type="button"
                            className={styles.backLink}
                            onClick={() => goBackFrom(currentStepId)}
                        >
                            ← Back
                        </button>
                    )}

                    <div
                        style={{
                            display: showForm ? 'block' : 'none',
                            pointerEvents: checkoutExpired ? 'none' : 'auto',
                            opacity: checkoutExpired ? 0.55 : 1,
                        }}
                    >
                        {currentStepId === 'overview' && (
                            <OverviewDetails
                                flightDetails={flightDetails}
                                passengers={checkoutPassengers}
                                ancillarySelections={ancillarySelections}
                            />
                        )}

                        <Form
                            flightdata={flightDetails}
                            onPassengersChange={handlePassengersChange}
                            mode={currentStepId === 'overview' ? 'overview' : 'passengers'}
                            onContinue={() => {
                                if (checkoutExpired) return
                                if (mayHaveAncillary && !ancillaryStatus.ready) {
                                    setPendingPassengerContinue(true)
                                    return
                                }
                                goNextFrom('passengers')
                            }}
                            ancillarySelections={ancillarySelections}
                            continueLoading={pendingPassengerContinue}
                        />
                    </div>

                    {mayHaveAncillary && (
                        <div
                            style={{
                                display: showAncillary ? 'block' : 'none',
                                pointerEvents: checkoutExpired ? 'none' : 'auto',
                                opacity: checkoutExpired ? 0.55 : 1,
                            }}
                        >
                            <AdditionalDetail
                                flightDetails={flightDetails}
                                passengers={checkoutPassengers}
                                embedded
                                view={
                                    currentStepId === 'luggage'
                                        ? 'luggage'
                                        : currentStepId === 'seats'
                                            ? 'seats'
                                            : hasLuggage
                                                ? 'luggage'
                                                : 'seats'
                                }
                                onContinue={() => {
                                    if (checkoutExpired) return
                                    goNextFrom(currentStepId)
                                }}
                                onBack={() => goBackFrom(currentStepId)}
                                onSelectionsChange={handleSelectionsChange}
                                onAvailabilityChange={handleAvailabilityChange}
                                hideBackButton
                            />
                        </div>
                    )}
                </div>

                <div className="col-lg-4 col-md-5 order-1 order-lg-2">
                    <div className={styles.summarySticky}>
                        <FlightSummary
                            flightDetails={flightDetails}
                            ancillarySelections={ancillarySelections}
                        />
                        <div className="mt-3">
                            <FlightCheckoutTimer
                                flightId={flightDetails?.id}
                                onExpire={handleCheckoutExpire}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}