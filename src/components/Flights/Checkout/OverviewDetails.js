'use client'

import React, { useMemo } from 'react'
import { MdAirlineSeatReclineExtra } from 'react-icons/md'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import AirlineAssignedBadge from './AirlineAssignedBadge'
import styles from './OverviewDetails.module.css'

function passengerDisplayName(passenger, index) {
    const name = [passenger?.firstName, passenger?.lastName].filter(Boolean).join(' ').trim()
    return name || `Passenger ${index + 1}`
}

function isInfant(passenger) {
    return String(passenger?.type || '').toLowerCase().includes('infant')
}

function formatAirportLabel(place) {
    if (!place) return null
    if (typeof place === 'string') {
        const text = place.trim()
        return text || null
    }
    const city = String(place.city || '').trim()
    const code = String(place.airport_code || place.code || '').trim()
    if (city && code) return `${city} (${code})`
    return city || code || null
}

export default function OverviewDetails({ flightDetails, passengers = [], ancillarySelections }) {
    const seatsByPassenger = ancillarySelections?.seats || {}
    const seatSegmentsFromApi = ancillarySelections?.seatSegments || []

    const seatPassengers = useMemo(
        () => (passengers || []).filter((p) => !isInfant(p)),
        [passengers]
    )

    const displaySegments = useMemo(() => {
        const flightSegments = flightDetails?.segments || []
        const flightByKey = {}

        flightSegments.forEach((segment) => {
            const from = formatAirportLabel(segment?.departure)
            const to = formatAirportLabel(segment?.arrival)
            const entry = {
                segment_key: segment?.segment_key,
                from: from || 'Origin',
                to: to || 'Destination',
            }
            if (segment?.segment_key) flightByKey[segment.segment_key] = entry
        })

        if (seatSegmentsFromApi.length) {
            return seatSegmentsFromApi.map((seg, index) => {
                const matched =
                    flightByKey[seg.segment_key] ||
                    (flightSegments[index] && {
                        from: formatAirportLabel(flightSegments[index]?.departure),
                        to: formatAirportLabel(flightSegments[index]?.arrival),
                    })

                const fromLooksLikeCodeOnly = seg.from && !String(seg.from).includes('(')
                const toLooksLikeCodeOnly = seg.to && !String(seg.to).includes('(')

                return {
                    segment_key: seg.segment_key,
                    from:
                        (fromLooksLikeCodeOnly && matched?.from) ||
                        seg.from ||
                        matched?.from ||
                        'Origin',
                    to:
                        (toLooksLikeCodeOnly && matched?.to) ||
                        seg.to ||
                        matched?.to ||
                        'Destination',
                }
            })
        }

        if (flightSegments.length) {
            return flightSegments.map((segment) => ({
                segment_key: segment?.segment_key,
                from: formatAirportLabel(segment?.departure) || 'Origin',
                to: formatAirportLabel(segment?.arrival) || 'Destination',
            }))
        }

        return [{ segment_key: null, from: 'Origin', to: 'Destination' }]
    }, [seatSegmentsFromApi, flightDetails])

    const hasSeatsStep = flightDetails?.ancillary_availability?.paid_seat === true
    const showSeats = hasSeatsStep && seatPassengers.length > 0

    if (!showSeats) return null

    return (
        <div className={`${styles.formCard} mb-4`}>
            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <span className={styles.sectionIcon} aria-hidden>
                        <MdAirlineSeatReclineExtra />
                    </span>
                    <h2 className={styles.sectionTitle}>Seat selection</h2>
                </div>
                <div className={styles.seatDetailBlocks}>
                    {displaySegments.map((segment, segIdx) => (
                        <div
                            key={segment.segment_key || `seg-${segIdx}`}
                            className={styles.seatDetailBlock}
                        >
                            <div className={styles.seatDetailHeader}>
                                <h3 className={styles.seatDetailRoute}>
                                    {segment.from} → {segment.to}
                                </h3>
                                {displaySegments.length > 1 && (
                                    <span className={styles.seatDetailCount}>
                                        {segIdx + 1} / {displaySegments.length}
                                    </span>
                                )}
                            </div>
                            <ul className={styles.seatDetailList}>
                                {seatPassengers.map((passenger, index) => {
                                    const seat = segment.segment_key
                                        ? seatsByPassenger?.[passenger.id]?.[segment.segment_key]
                                        : Object.values(seatsByPassenger?.[passenger.id] || {})[0]
                                    const name = passengerDisplayName(passenger, index)
                                    const seatPrice = seat?.seatPrice ?? seat?.price
                                    const seatCurrency = seat?.seatCurrency || seat?.currency

                                    return (
                                        <li
                                            key={`${passenger.id}-${segment.segment_key || segIdx}`}
                                            className={styles.seatDetailRow}
                                        >
                                            <span className={styles.seatDetailName}>{name}</span>
                                            {seat?.seatName ? (
                                                <span className={styles.seatDetailAssigned}>
                                                    <MdAirlineSeatReclineExtra />
                                                    <span>{seat.seatName}</span>
                                                    {seatPrice != null && seatPrice !== '' && (
                                                        <span className={styles.seatDetailPrice}>
                                                            <PriceDisplay
                                                                currency={seatCurrency}
                                                                price={seatPrice}
                                                            />
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <AirlineAssignedBadge />
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}