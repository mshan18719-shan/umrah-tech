'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FaSuitcase, FaCheck } from 'react-icons/fa'
import { MdAirlineSeatReclineExtra } from 'react-icons/md'
import { IoChevronDown } from 'react-icons/io5'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import { ConvertPrice } from '@/components/Currency/ConvertPrice'
import { useCurrency } from '@/util/currency'
import { getTravelerCounts, isCabinBag, getBaggageLabel, formatBaggageWeight, groupSegments, getBookingTripType } from './flightHelpers'
import styles from './AdditionalDetail.module.css'

function getTripType(flight) {
    return getBookingTripType(flight)
}

function buildAncillaryTypes(ancillary) {
    const types = []
    if (ancillary?.paid_bag === true) types.push('baggage')
    if (ancillary?.paid_seat === true) types.push('seat')
    return types
}

function hasAncillaryAvailability(flight) {
    const ancillary = flight?.ancillary_availability
    if (!ancillary) return false
    return ancillary.paid_bag === true || ancillary.paid_seat === true
}

function buildPricingPayload(flight) {
    const counts = getTravelerCounts(flight)
    return {
        provider: flight?.provider || '',
        id: flight?.id || '',
        tag: flight?.tag == null ? '' : flight.tag,
        adult: Number(counts.adult) || 1,
        child: Number(counts.child) || 0,
        infants: Number(counts.infant) || 0,
        trip_type: getTripType(flight),
        segments: flight?.segments || [],
        ancillary_types: buildAncillaryTypes(flight?.ancillary_availability),
    }
}

function normalizePricingPayload(response) {
    if (!response) return null
    if (response?.data?.journeys) return response.data
    if (response?.journeys) return response
    // Some responses nest journeys under data.ancillaries
    if (Array.isArray(response?.data?.ancillaries)) {
        return { ...response.data, journeys: response.data.ancillaries }
    }
    if (Array.isArray(response?.ancillaries)) {
        return { ...response, journeys: response.ancillaries }
    }
    return null
}

function isSeatAvailable(seat) {
    return String(seat?.available).toLowerCase() === 'true'
}

function getBaggageDescription(option) {
    const desc = String(option?.description || '').trim()
    if (!desc || /[\u4e00-\u9fff]/.test(desc)) {
        return isCabinBag(option) ? 'Carry-on / cabin baggage' : 'Checked baggage'
    }
    return desc
}

function getBagPieceDetail(option) {
    const pieceRaw = option?.baggage_piece
    const piece = pieceRaw != null && String(pieceRaw).trim() !== '' ? String(pieceRaw).trim() : ''
    const weight = formatBaggageWeight(option?.baggage_weight)
    if (piece && weight) return `${piece}PC × ${weight}`
    if (weight) return weight
    return getBaggageDescription(option)
}

function getBagWeightDisplay(option) {
    const weight = formatBaggageWeight(option?.baggage_weight)
    if (weight) return weight.toUpperCase()
    return getBaggageLabel(option)
}

function normalizeIncludedBaggage(entry) {
    if (!entry) return null
    const baggage = Array.isArray(entry) ? entry[0] : entry
    if (!baggage || typeof baggage !== 'object') return null
    const cabin = String(baggage.cabin || '').trim()
    const checked = String(baggage.checked || '').trim()
    if (!cabin && !checked) return null
    return { cabin, checked }
}

function getIncludedBaggageByLeg(flightDetails) {
    const groups = groupSegments(flightDetails)
    const tripType = getTripType(flightDetails)
    const result = { outbound: null, return: null }

    const fromGroup = (group) => {
        const segment =
            (group?.segments || []).find((seg) => seg?.baggage_info) || group?.segments?.[0]
        return segment?.baggage_info || null
    }

    if (tripType === 'return' && groups.length >= 2) {
        result.outbound = fromGroup(groups[0])
        result.return = fromGroup(groups[1])
        return result
    }

    if (groups.length > 0) {
        result.outbound = fromGroup(groups[0])
    }

    return result
}

function getIncludedForPassenger(baggageInfo, passengerType) {
    if (!baggageInfo) return null
    const type = String(passengerType || 'adult').toLowerCase()
    return (
        normalizeIncludedBaggage(baggageInfo[type]) ||
        normalizeIncludedBaggage(baggageInfo.adult) ||
        null
    )
}

function buildSeatGrid(seatMaps = []) {
    const columns = [...new Set(seatMaps.map((s) => s.column).filter(Boolean))]
    // Keep natural cabin order A→F when present
    columns.sort((a, b) => a.localeCompare(b))

    const rows = [...new Set(seatMaps.map((s) => String(s.row)))]
        .sort((a, b) => Number(a) - Number(b))

    const byKey = new Map(seatMaps.map((s) => [`${s.row}-${s.column}`, s]))

    // Insert aisle gap after left bank (usually after C for 3-3)
    const aisleAfterIndex = columns.length >= 6 ? 2 : Math.floor((columns.length - 1) / 2)

    return { columns, rows, byKey, aisleAfterIndex }
}

function formatSeatPrice(price, originalCurrency, selectedCurrency, rates) {
    const converted = ConvertPrice(price, originalCurrency, selectedCurrency, rates || {})
    const value = Number(converted.newprice)
    if (Number.isNaN(value)) return converted.newcurrency || originalCurrency || ''
    const amount = value % 1 === 0 ? String(value) : value.toFixed(1)
    const code = String(converted.newcurrency || originalCurrency || '').trim()
    return code ? `${code} ${amount}` : amount
}

function formatSeatPriceTooltip(price, originalCurrency, selectedCurrency, rates) {
    const converted = ConvertPrice(price, originalCurrency, selectedCurrency, rates || {})
    const value = Number(converted.newprice)
    if (Number.isNaN(value)) return ''
    const code = String(converted.newcurrency || originalCurrency || '').trim()
    const symbols = { GBP: '£', EUR: '€', USD: '$', AED: 'AED ', SAR: 'SAR ' }
    const symbol = symbols[code] || (code ? `${code} ` : '')
    return `${symbol}${value.toFixed(2)}`
}

function buildSeatPassengers(passengers = []) {
    return (passengers || [])
        .filter((p) => !String(p?.type || '').toLowerCase().includes('infant'))
        .map((p, index) => {
            const firstName = String(p?.firstName || '').trim()
            const lastName = String(p?.lastName || '').trim()
            const name = [firstName, lastName].filter(Boolean).join(' ')
            return {
                id: String(p?.id ?? `passenger-${index}`),
                name: name || `Passenger ${index + 1}`,
                type: p?.type || 'adult',
                hasName: Boolean(firstName && lastName),
            }
        })
}

function countSelectedSeats(selectedSeats = {}) {
    return Object.values(selectedSeats).reduce(
        (sum, bySegment) => sum + Object.keys(bySegment || {}).length,
        0
    )
}

function sumSelectedSeatPrices(selectedSeats = {}) {
    return Object.values(selectedSeats).reduce((sum, bySegment) => {
        return (
            sum +
            Object.values(bySegment || {}).reduce(
                (inner, seat) => inner + Number(seat?.seatPrice || 0),
                0
            )
        )
    }, 0)
}

function firstSelectedSeatCurrency(selectedSeats = {}) {
    for (const bySegment of Object.values(selectedSeats)) {
        const seat = Object.values(bySegment || {})[0]
        if (seat?.seatCurrency) return seat.seatCurrency
    }
    return null
}

function formatPlaceLabel(city, code) {
    const cityName = String(city || '').trim()
    const airportCode = String(code || '').trim()
    if (cityName && airportCode) return `${cityName} (${airportCode})`
    return cityName || airportCode || ''
}

function buildBaggageLegs(flightDetails) {
    const groups = groupSegments(flightDetails)
    const tripType = getTripType(flightDetails)

    const toLeg = (group, id, label) => {
        const segments = group?.segments || []
        const first = segments[0]
        const last = segments[segments.length - 1]
        return {
            id,
            label,
            from:
                formatPlaceLabel(first?.departure?.city, first?.departure?.airport_code) ||
                'Origin',
            to:
                formatPlaceLabel(last?.arrival?.city, last?.arrival?.airport_code) ||
                'Destination',
        }
    }

    if (tripType === 'return') {
        if (groups.length >= 2) {
            return [
                toLeg(groups[0], 'outbound', 'Outbound'),
                toLeg(groups[1], 'return', 'Return'),
            ]
        }

        const segments = flightDetails?.segments || []
        if (segments.length >= 2) {
            const midpoint = Math.ceil(segments.length / 2)
            return [
                toLeg({ segments: segments.slice(0, midpoint) }, 'outbound', 'Outbound'),
                toLeg({ segments: segments.slice(midpoint) }, 'return', 'Return'),
            ]
        }
    }

    if (groups.length > 0) {
        return [toLeg(groups[0], 'outbound', 'Flight')]
    }

    return [{ id: 'outbound', label: 'Flight', from: 'Origin', to: 'Destination' }]
}

function flattenBaggageSelections(selectedBaggage = {}, passengers = [], legs = []) {
    const items = []
    passengers.forEach((passenger, index) => {
        legs.forEach((leg) => {
            const bag = selectedBaggage?.[passenger.id]?.[leg.id]
            if (!bag) return
            items.push({
                ...bag,
                passengerId: passenger.id,
                passengerName: passenger.name || `Passenger ${index + 1}`,
                passengerIndex: index,
                legId: leg.id,
                legLabel: leg.label,
                route: `${leg.from} → ${leg.to}`,
            })
        })
    })
    return items
}

function sumSelectedBaggagePrices(selectedBaggage = {}) {
    return Object.values(selectedBaggage).reduce((sum, byLeg) => {
        return (
            sum +
            Object.values(byLeg || {}).reduce((inner, bag) => inner + Number(bag?.price || 0), 0)
        )
    }, 0)
}

function countSelectedBags(selectedBaggage = {}) {
    return Object.values(selectedBaggage).reduce(
        (sum, byLeg) => sum + Object.keys(byLeg || {}).length,
        0
    )
}

function firstSelectedBaggageCurrency(selectedBaggage = {}) {
    for (const byLeg of Object.values(selectedBaggage)) {
        const bag = Object.values(byLeg || {})[0]
        if (bag?.currency) return bag.currency
    }
    return null
}

function sanitizeBaggageOption(bag = {}) {
    return {
        ancillary_key: bag.ancillary_key,
        ancillary_type: bag.ancillary_type ?? 1,
        description: bag.description,
        currency: bag.currency,
        price: bag.price,
        pay_baggage_type: bag.pay_baggage_type,
        baggage_piece: bag.baggage_piece,
        baggage_weight: bag.baggage_weight,
    }
}

function sanitizeSegment(segment = {}) {
    if (!segment) return null
    const airline =
        resolveAirlineCode(segment.airline) ||
        segment.airline_code ||
        (typeof segment.airline === 'string' ? segment.airline : '')
    return {
        airline,
        flightNum: segment.flightNum || segment.flight_number || '',
        departure: segment.departure?.airport_code || segment.departure || '',
        departureDate: segment.departureDate || segment.departure?.date || '',
        departureTime: segment.departureTime || segment.departure?.time || '',
        arrival: segment.arrival?.airport_code || segment.arrival || '',
        arrivalDate: segment.arrivalDate || segment.arrival?.date || '',
        arrivalTime: segment.arrivalTime || segment.arrival?.time || '',
        bookingCode:
            segment.bookingCode ||
            segment.booking_code ||
            segment.booking_class?.code ||
            '',
        segmentKey: segment.segmentKey || segment.segment_key || '',
        cabinClass:
            segment.cabinClass ||
            (typeof segment.cabin_class === 'string' ? segment.cabin_class : null) ||
            (segment.cabin_class?.name === 'Economy' ? 'ECONOMY' : segment.cabin_class?.name) ||
            'ECONOMY',
        codeShare:
            segment.codeShare ||
            (segment.code_share === true || segment.code_share === 'Y' ? 'Y' : 'N'),
    }
}

/** Booking API segments must not include segmentKey (not present in pricing response). */
function toAncillarySegment(segment = null) {
    if (!segment) return null
    const {
        airline,
        flightNum,
        departure,
        departureDate,
        departureTime,
        arrival,
        arrivalDate,
        arrivalTime,
        bookingCode,
        cabinClass,
        codeShare,
    } = sanitizeSegment(segment)
    return {
        airline,
        flightNum,
        departure,
        departureDate,
        departureTime,
        arrival,
        arrivalDate,
        arrivalTime,
        bookingCode,
        cabinClass,
        codeShare,
    }
}

function sanitizeSeatSelection(seat = {}, segment = null) {
    return {
        ancillaryKey: seat.ancillaryKey,
        ancillaryType: seat.ancillaryType ?? 2,
        seatName: seat.seatName,
        column: seat.column,
        row: seat.row,
        deck: seat.deck,
        available: seat.available,
        seatCurrency: seat.seatCurrency,
        seatPrice: seat.seatPrice,
        characteristics: Array.isArray(seat.characteristics) ? seat.characteristics : [],
        segment: toAncillarySegment(segment),
    }
}

function findJourneySegment(journey, segmentKey) {
    const segments = journey?.segments || []
    return (
        segments.find((seg) => seg.segmentKey === segmentKey || seg.segment_key === segmentKey) ||
        null
    )
}

function ensureSegmentKey(sanitized, index = 0) {
    if (!sanitized) return null
    if (sanitized.segmentKey) return sanitized
    const fallbackKey = [
        sanitized.departure || 'dep',
        sanitized.arrival || 'arr',
        sanitized.departureDate || '',
        sanitized.flightNum || '',
        String(index),
    ]
        .filter(Boolean)
        .join('-')
    return { ...sanitized, segmentKey: fallbackKey || `segment-${index}` }
}

function resolveAirlineCode(airline) {
    if (!airline) return ''
    if (typeof airline === 'string') return airline
    return airline.code || airline.airline_code || ''
}

function flightSegToAncillaryShape(seg = {}) {
    return {
        airline: resolveAirlineCode(seg.airline) || seg.airline_code || '',
        flightNum: seg.flight_number || seg.flightNum || '',
        departure: seg.departure?.airport_code || seg.departure || '',
        departureDate: seg.departure?.date || seg.departureDate || '',
        departureTime: seg.departure?.time || seg.departureTime || '',
        arrival: seg.arrival?.airport_code || seg.arrival || '',
        arrivalDate: seg.arrival?.date || seg.arrivalDate || '',
        arrivalTime: seg.arrival?.time || seg.arrivalTime || '',
        bookingCode:
            seg.booking_code ||
            seg.bookingCode ||
            seg.booking_class?.code ||
            '',
        segmentKey: seg.segment_key || seg.segmentKey || '',
        cabinClass:
            seg.cabinClass ||
            (typeof seg.cabin_class === 'string' ? seg.cabin_class : null) ||
            seg.cabin_class?.name ||
            'ECONOMY',
        codeShare:
            seg.codeShare ||
            (seg.code_share === true || seg.code_share === 'Y' ? 'Y' : 'N'),
    }
}

function journeyContainsSegmentKey(journey, segmentKey) {
    if (!journey || !segmentKey) return false
    if (journey.segmentKey === segmentKey) return true
    if (Array.isArray(journey.segmentKeys) && journey.segmentKeys.includes(segmentKey)) return true
    return (journey.segments || []).some(
        (seg) => seg.segmentKey === segmentKey || seg.segment_key === segmentKey
    )
}

/**
 * Build ancillary journeys by trip type:
 * - one_way  → 1 journey with ALL segments (stops included)
 * - return   → 2 journeys (outbound + return), each with its segments
 * - multi_city → 1 journey per complete leg
 */
function buildBookingJourneys(apiJourneys = [], flightDetails = null) {
    const flightSegments = Array.isArray(flightDetails?.segments) ? flightDetails.segments : []
    const tripType = getTripType(flightDetails)

    const enrichFromFlight = (sanitized) => {
        if (!sanitized || sanitized.segmentKey) return sanitized
        const match = flightSegments.find((fs) => {
            const dep = fs?.departure?.airport_code || fs?.departure
            const arr = fs?.arrival?.airport_code || fs?.arrival
            return dep && arr && dep === sanitized.departure && arr === sanitized.arrival
        })
        if (match?.segment_key || match?.segmentKey) {
            return { ...sanitized, segmentKey: match.segment_key || match.segmentKey }
        }
        return sanitized
    }

    const sanitizeList = (segs = []) =>
        segs
            .map((seg, index) =>
                ensureSegmentKey(enrichFromFlight(sanitizeSegment(seg)), index)
            )
            .filter((seg) => seg?.segmentKey)

    const toBookingJourney = (segments, raw = null) => {
        if (!segments?.length) return null
        return {
            segments,
            segmentKey: segments[0].segmentKey,
            segmentKeys: segments.map((s) => s.segmentKey),
            raw,
        }
    }

    // Prefer pricing API journey grouping when it looks correct for trip type
    if (apiJourneys.length) {
        let fromApi = apiJourneys
            .map((apiJourney) => toBookingJourney(sanitizeList(apiJourney?.segments || []), apiJourney))
            .filter(Boolean)

        if (fromApi.length) {
            // one_way must be a single journey — merge if API split connections
            if (tripType === 'one_way' && fromApi.length > 1) {
                const allSegs = fromApi.flatMap((j) => j.segments)
                fromApi = [toBookingJourney(allSegs, apiJourneys[0])].filter(Boolean)
            }

            // return: expect 2 journeys; if API sent 1 with all segs, split via flight groups
            if (tripType === 'return' && fromApi.length === 1 && flightSegments.length >= 2) {
                const groups = groupSegments(flightDetails)
                if (groups.length >= 2) {
                    const split = groups
                        .map((group) =>
                            toBookingJourney(
                                sanitizeList((group.segments || []).map(flightSegToAncillaryShape)),
                                null
                            )
                        )
                        .filter(Boolean)
                    if (split.length >= 2) fromApi = split
                }
            }

            return fromApi
        }
    }

    // Fallback: group flight segments by trip type / legs
    const groups = groupSegments(flightDetails)
    if (groups.length) {
        let journeys = groups
            .map((group) =>
                toBookingJourney(
                    sanitizeList((group.segments || []).map(flightSegToAncillaryShape)),
                    null
                )
            )
            .filter(Boolean)

        if (tripType === 'one_way' && journeys.length > 1) {
            journeys = [
                toBookingJourney(
                    journeys.flatMap((j) => j.segments),
                    null
                ),
            ].filter(Boolean)
        }

        return journeys
    }

    if (flightSegments.length) {
        const segs = sanitizeList(flightSegments.map(flightSegToAncillaryShape))
        const journey = toBookingJourney(segs, null)
        return journey ? [journey] : []
    }

    return []
}

function resolveSegmentJourneyIndex(bookingJourneys, segmentKey, apiJourneys) {
    if (!segmentKey) return 0

    const direct = bookingJourneys.findIndex((j) => journeyContainsSegmentKey(j, segmentKey))
    if (direct >= 0) return direct

    for (const apiJourney of apiJourneys) {
        const matched = findJourneySegment(apiJourney, segmentKey)
        if (!matched) continue
        const key = matched.segmentKey || matched.segment_key
        const idx = bookingJourneys.findIndex((j) => journeyContainsSegmentKey(j, key))
        if (idx >= 0) return idx
    }

    // Match by route codes inside journey segments
    for (let i = 0; i < bookingJourneys.length; i += 1) {
        const segs = bookingJourneys[i]?.segments || []
        if (segs.some((s) => `${s.departure}-${s.arrival}` === segmentKey)) return i
    }

    return 0
}

/**
 * Map baggage UI legs → journey indexes (one journey per complete leg).
 * one_way → [0], return → outbound [0] / return [1], multi_city → per leg.
 */
function buildLegToJourneyIndexes(baggageLegs, bookingJourneys, flightDetails) {
    const map = {}
    const groups = groupSegments(flightDetails)
    const tripType = getTripType(flightDetails)

    const findJourneyIndexForGroup = (group) => {
        const groupSegs = group?.segments || []
        for (const flightSeg of groupSegs) {
            const flightKey = flightSeg?.segment_key
            if (flightKey) {
                const idx = bookingJourneys.findIndex((j) => journeyContainsSegmentKey(j, flightKey))
                if (idx >= 0) return idx
            }

            const dep = flightSeg?.departure?.airport_code
            const arr = flightSeg?.arrival?.airport_code
            const idx = bookingJourneys.findIndex((journey) =>
                (journey.segments || []).some((seg) => seg.departure === dep && seg.arrival === arr)
            )
            if (idx >= 0) return idx
        }
        return -1
    }

    if (tripType === 'one_way') {
        map.outbound = [0]
        map.Flight = [0]
        map.return = [0]
    } else if (tripType === 'return') {
        const outboundIdx = groups[0] ? findJourneyIndexForGroup(groups[0]) : 0
        const returnIdx = groups[1]
            ? findJourneyIndexForGroup(groups[1])
            : Math.min(1, Math.max(bookingJourneys.length - 1, 0))
        map.outbound = [outboundIdx >= 0 ? outboundIdx : 0]
        map.return = [returnIdx >= 0 ? returnIdx : Math.min(1, bookingJourneys.length - 1)]
    } else {
        // multi_city: one journey index per group/leg
        groups.forEach((group, index) => {
            const idx = findJourneyIndexForGroup(group)
            const journeyIndex = idx >= 0 ? idx : Math.min(index, bookingJourneys.length - 1)
            if (index === 0) map.outbound = [journeyIndex]
            map[`leg-${index}`] = [journeyIndex]
        })
        if (!map.outbound?.length) map.outbound = [0]
        map.return = map.outbound
        map.Flight = map.outbound
    }

    baggageLegs.forEach((leg, index) => {
        if (map[leg.id]) return
        if (tripType === 'multi_city' && map[`leg-${index}`]) {
            map[leg.id] = map[`leg-${index}`]
            return
        }
        map[leg.id] = map.outbound || [0]
    })

    if (!map.outbound?.length) map.outbound = [0]
    if (!map.return?.length) {
        map.return = [Math.min(bookingJourneys.length - 1, 0)]
    }

    return map
}

/**
 * Build booking ancillary payload from UI selections.
 * Journeys are grouped by trip type (one_way=1, return=2, multi_city=per leg).
 * ancillary: {
 *   journeys: [
 *     {
 *       segments: [ ...all segments for that journey ],
 *       selections: [{ passenger_index, baggage?, seat? }]
 *     }
 *   ]
 * }
 */
function isInfantPassenger(passenger) {
    return String(passenger?.type || '').toLowerCase().includes('infant')
}

function buildAncillaryPayload({
    apiJourneys = [],
    passengers = [],
    selectedBaggage = {},
    selectedSeats = {},
    baggageLegs = [],
    flightDetails,
}) {
    const bookingJourneys = buildBookingJourneys(apiJourneys, flightDetails)
    const hasBagSelection = Object.values(selectedBaggage || {}).some((byLeg) =>
        Object.values(byLeg || {}).some((bag) => bag?.ancillary_key)
    )
    const hasSeatSelection = Object.values(selectedSeats || {}).some((bySeg) =>
        Object.values(bySeg || {}).some((seat) => seat?.ancillaryKey)
    )

    if (!bookingJourneys.length) {
        // Still try one shell journey when user selected bags/seats
        if (!hasBagSelection && !hasSeatSelection) return { journeys: [] }
        bookingJourneys.push({
            segments: [
                ensureSegmentKey(
                    sanitizeSegment({
                        departure: flightDetails?.segments?.[0]?.departure?.airport_code,
                        arrival: flightDetails?.segments?.[0]?.arrival?.airport_code,
                        segmentKey: flightDetails?.segments?.[0]?.segment_key || 'journey-0',
                    }),
                    0
                ),
            ],
            segmentKey: flightDetails?.segments?.[0]?.segment_key || 'journey-0',
            segmentKeys: [flightDetails?.segments?.[0]?.segment_key || 'journey-0'],
            raw: apiJourneys[0] || null,
        })
    }

    const legToJourneyIndexes = buildLegToJourneyIndexes(
        baggageLegs,
        bookingJourneys,
        flightDetails
    )

    const perJourney = bookingJourneys.map(() => ({}))
    const passengerIndexById = new Map()

    passengers.forEach((passenger, passengerIndex) => {
        const passengerId = String(passenger?.id ?? `passenger-${passengerIndex}`)
        passengerIndexById.set(passengerId, passengerIndex)
        if (passenger?.id != null) passengerIndexById.set(String(passenger.id), passengerIndex)
    })

    const ensureSelection = (journeyIndex, passengerId, passengerIndex) => {
        if (!perJourney[journeyIndex][passengerId]) {
            perJourney[journeyIndex][passengerId] = {
                passenger_index: passengerIndex,
                baggage: [],
                seat: [],
            }
        }
        return perJourney[journeyIndex][passengerId]
    }

    const resolvePassengerIndex = (passengerId, fallbackIndex) => {
        if (passengerIndexById.has(String(passengerId))) {
            return passengerIndexById.get(String(passengerId))
        }
        return fallbackIndex
    }

    const findSegmentInJourney = (journey, segmentKey) => {
        if (!journey) return null
        return (
            (journey.segments || []).find(
                (seg) => seg.segmentKey === segmentKey || seg.segment_key === segmentKey
            ) ||
            journey.segments?.[0] ||
            null
        )
    }

    // Prefer full passengers list (same order as booking request: lead = 0)
    passengers.forEach((passenger, passengerIndex) => {
        if (isInfantPassenger(passenger)) return

        const passengerId = String(passenger?.id ?? `passenger-${passengerIndex}`)
        const bagsByLeg = selectedBaggage?.[passenger.id] || selectedBaggage?.[passengerId] || {}

        Object.entries(bagsByLeg).forEach(([legId, bag]) => {
            if (!bag?.ancillary_key) return
            // Attach bag once to the journey for that leg
            const journeyIndexes = legToJourneyIndexes[legId] || legToJourneyIndexes.outbound || [0]
            journeyIndexes.forEach((journeyIndex) => {
                const selection = ensureSelection(journeyIndex, passengerId, passengerIndex)
                if (!selection.baggage.some((b) => b.ancillary_key === bag.ancillary_key)) {
                    selection.baggage.push(sanitizeBaggageOption(bag))
                }
            })
        })

        const seatsBySegment =
            selectedSeats?.[passenger.id] || selectedSeats?.[passengerId] || {}

        Object.entries(seatsBySegment).forEach(([segmentKey, seat]) => {
            if (!seat?.ancillaryKey) return
            const journeyIndex = resolveSegmentJourneyIndex(
                bookingJourneys,
                segmentKey,
                apiJourneys
            )
            const journey = bookingJourneys[journeyIndex]
            const selection = ensureSelection(journeyIndex, passengerId, passengerIndex)
            selection.seat.push(
                sanitizeSeatSelection(seat, findSegmentInJourney(journey, segmentKey))
            )
        })
    })

    // Catch selections keyed by passenger id that were not covered above
    Object.entries(selectedBaggage || {}).forEach(([passengerId, bagsByLeg], fallbackIndex) => {
        Object.entries(bagsByLeg || {}).forEach(([legId, bag]) => {
            if (!bag?.ancillary_key) return
            const journeyIndexes = legToJourneyIndexes[legId] || legToJourneyIndexes.outbound || [0]
            const passengerIndex = resolvePassengerIndex(passengerId, fallbackIndex)
            journeyIndexes.forEach((journeyIndex) => {
                const already = perJourney[journeyIndex]?.[passengerId]?.baggage?.some(
                    (b) => b.ancillary_key === bag.ancillary_key
                )
                if (already) return
                const selection = ensureSelection(journeyIndex, String(passengerId), passengerIndex)
                selection.baggage.push(sanitizeBaggageOption(bag))
            })
        })
    })

    Object.entries(selectedSeats || {}).forEach(([passengerId, seatsBySegment], fallbackIndex) => {
        Object.entries(seatsBySegment || {}).forEach(([segmentKey, seat]) => {
            if (!seat?.ancillaryKey) return
            const journeyIndex = resolveSegmentJourneyIndex(
                bookingJourneys,
                segmentKey,
                apiJourneys
            )
            const already = perJourney[journeyIndex]?.[passengerId]?.seat?.some(
                (s) => s.ancillaryKey === seat.ancillaryKey
            )
            if (already) return
            const passengerIndex = resolvePassengerIndex(passengerId, fallbackIndex)
            const journey = bookingJourneys[journeyIndex]
            const selection = ensureSelection(journeyIndex, String(passengerId), passengerIndex)
            selection.seat.push(
                sanitizeSeatSelection(seat, findSegmentInJourney(journey, segmentKey))
            )
        })
    })

    if (!hasBagSelection && !hasSeatSelection) {
        return { journeys: [] }
    }

    const toSelectionPayload = (item) => {
        const payload = { passenger_index: item.passenger_index }
        if (item.baggage?.length > 0) payload.baggage = item.baggage
        if (item.seat?.length > 0) payload.seat = item.seat
        return payload
    }

    return {
        // Journeys grouped by trip type; each journey includes all its segments
        journeys: bookingJourneys.map((journey, journeyIndex) => ({
            segments: (journey.segments || []).map((seg) => toAncillarySegment(seg)).filter(Boolean),
            selections: Object.values(perJourney[journeyIndex] || {})
                .filter((item) => item.baggage.length > 0 || item.seat.length > 0)
                .sort((a, b) => a.passenger_index - b.passenger_index)
                .map(toSelectionPayload),
        })),
    }
}

const STEP_HEADERS = {
    baggage: {
        title: 'Baggage allowance',
        tip: 'Save more by adding baggage allowance now. Bring along everything you need for your journey.',
        variant: 'baggage',
        icon: <FaSuitcase />,
    },
    seat: {
        title: 'Seat selection',
        description: 'Make your trip more comfortable by choosing your preferred seats now.',
        variant: 'seat',
        icon: <MdAirlineSeatReclineExtra />,
    },
}

function StepSectionHeader({ stepId }) {
    const config = STEP_HEADERS[stepId]
    if (!config) return null

    return (
        <div className={styles.sectionHeaderBlock}>
            <div className={styles.sectionHeader}>
                <div
                    className={`${styles.sectionIconWrap} ${
                        config.variant === 'seat' ? styles.sectionIcon_seat : styles.sectionIcon_baggage
                    }`}
                >
                    <span className={styles.sectionIcon}>{config.icon}</span>
                    <span className={styles.sectionIconBadge} aria-hidden>
                        <FaCheck />
                    </span>
                </div>
                <div className={styles.sectionHeaderText}>
                    <h2 className={styles.sectionHeading}>{config.title}</h2>
                    {config.description && (
                        <p className={styles.sectionDescription}>{config.description}</p>
                    )}
                </div>
            </div>
            {config.tip && (
                <div className={styles.bagSaveTip} role="note">
                    <span className={styles.bagSaveTipIcon} aria-hidden>
                        <FaCheck />
                    </span>
                    <p className={styles.bagSaveTipText}>{config.tip}</p>
                </div>
            )}
        </div>
    )
}

function SeatPickerBar({
    seatSegments,
    segmentLookup,
    activeSegmentKey,
    onSegmentChange,
    passengers,
    activePassengerId,
    onPassengerChange,
    selectedSeats,
}) {
    const [openMenu, setOpenMenu] = useState(null)
    const barRef = useRef(null)

    useEffect(() => {
        const onDocClick = (event) => {
            if (!barRef.current?.contains(event.target)) setOpenMenu(null)
        }
        document.addEventListener('mousedown', onDocClick)
        return () => document.removeEventListener('mousedown', onDocClick)
    }, [])

    const segmentIndex = Math.max(
        0,
        seatSegments.findIndex((s) => s.segment_key === activeSegmentKey)
    )
    const activeSegment = seatSegments[segmentIndex] || seatSegments[0]
    const segmentMeta = segmentLookup[activeSegment?.segment_key] || {}
    const segmentLabel = segmentMeta.route || 'Select segment'

    const passengerIndex = Math.max(
        0,
        passengers.findIndex((p) => p.id === activePassengerId)
    )
    const activePassenger = passengers[passengerIndex] || passengers[0]
    const passengerSeat = selectedSeats?.[activePassenger?.id]?.[activeSegment?.segment_key]
    const passengerStatus = passengerSeat ? `Seat ${passengerSeat.seatName}` : 'Selecting'

    return (
        <div className={styles.pickerBar} ref={barRef}>
            <div className={styles.pickerHalf}>
                <button
                    type="button"
                    className={styles.pickerTrigger}
                    onClick={() => setOpenMenu((prev) => (prev === 'segment' ? null : 'segment'))}
                    aria-expanded={openMenu === 'segment'}
                >
                    <span className={styles.pickerMain}>{segmentLabel}</span>
                    <span className={styles.pickerMeta}>
                        {segmentIndex + 1} / {seatSegments.length || 1}
                        <IoChevronDown className={styles.pickerChevron} />
                    </span>
                </button>
                {openMenu === 'segment' && (
                    <div className={styles.pickerMenu}>
                        {seatSegments.map((seg, idx) => {
                            const info = segmentLookup[seg.segment_key] || {}
                            const label = info.route || `Segment ${idx + 1}`
                            const isActive = seg.segment_key === activeSegment?.segment_key
                            return (
                                <button
                                    key={seg.segment_key}
                                    type="button"
                                    className={`${styles.pickerMenuItem}${isActive ? ` ${styles.pickerMenuItemActive}` : ''}`}
                                    onClick={() => {
                                        onSegmentChange(seg.segment_key)
                                        setOpenMenu(null)
                                    }}
                                >
                                    <span>{label}</span>
                                    <span className={styles.pickerMenuCount}>
                                        {idx + 1} / {seatSegments.length}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className={styles.pickerDivider} />

            <div className={styles.pickerHalf}>
                <button
                    type="button"
                    className={styles.pickerTrigger}
                    onClick={() => setOpenMenu((prev) => (prev === 'passenger' ? null : 'passenger'))}
                    aria-expanded={openMenu === 'passenger'}
                >
                    <span className={styles.pickerTextStack}>
                        <span className={styles.pickerMain}>{activePassenger?.name || 'Passenger'}</span>
                        <span className={styles.pickerSub}>{passengerStatus}</span>
                    </span>
                    <span className={styles.pickerMeta}>
                        {passengerIndex + 1} / {passengers.length || 1}
                        <IoChevronDown className={styles.pickerChevron} />
                    </span>
                </button>
                {openMenu === 'passenger' && (
                    <div className={styles.pickerMenu}>
                        {passengers.map((passenger, idx) => {
                            const seat = selectedSeats?.[passenger.id]?.[activeSegment?.segment_key]
                            const isActive = passenger.id === activePassenger?.id
                            return (
                                <button
                                    key={passenger.id}
                                    type="button"
                                    className={`${styles.pickerMenuItem}${isActive ? ` ${styles.pickerMenuItemActive}` : ''}`}
                                    onClick={() => {
                                        onPassengerChange(passenger.id)
                                        setOpenMenu(null)
                                    }}
                                >
                                    <span className={styles.pickerTextStack}>
                                        <span>{passenger.name}</span>
                                        <span className={styles.pickerSub}>
                                            {seat ? `Seat ${seat.seatName}` : 'Selecting'}
                                        </span>
                                    </span>
                                    <span className={styles.pickerMenuCount}>
                                        {idx + 1} / {passengers.length}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function SeatMap({
    seatMaps,
    selectedKey,
    occupiedKeys = [],
    seatLabels = {},
    seatPassengerNames = {},
    passengerName,
    onSelect,
}) {
    const [hoverSeatKey, setHoverSeatKey] = useState(null)
    const { currency: selectedCurrency, rates } = useCurrency()
    const { columns, rows, byKey, aisleAfterIndex } = useMemo(
        () => buildSeatGrid(seatMaps),
        [seatMaps]
    )
    const occupied = useMemo(() => new Set(occupiedKeys), [occupiedKeys])

    const gridTemplate = `36px 22px ${columns
        .map((_, idx) => (idx === aisleAfterIndex ? '72px 28px' : '72px'))
        .join(' ')} 22px 36px`

    return (
        <div className={styles.seatMapShell}>
            <div className={styles.seatMap}>
                <div className={styles.colHeaders} style={{ gridTemplateColumns: gridTemplate }}>
                    <span className={styles.rowLabel} />
                    <span className={styles.exitMark} />
                    {columns.map((col, idx) => (
                        <React.Fragment key={col}>
                            <span className={styles.colHeader}>{col}</span>
                            {idx === aisleAfterIndex ? <span className={styles.aisle} /> : null}
                        </React.Fragment>
                    ))}
                    <span className={styles.exitMark} />
                    <span className={styles.rowLabel} />
                </div>

                {rows.map((row) => {
                    const rowSeats = columns.map((col) => byKey.get(`${row}-${col}`)).filter(Boolean)
                    const isExitRow = rowSeats.some((s) =>
                        (s.characteristics || []).includes('exit row')
                    )

                    return (
                        <div
                            key={row}
                            className={`${styles.seatRow}${isExitRow ? ` ${styles.seatRowExit}` : ''}`}
                            style={{ gridTemplateColumns: gridTemplate }}
                        >
                            <span className={styles.rowLabel}>{row}</span>
                            <span className={styles.exitMark}>
                                {isExitRow ? (
                                    <span className={styles.exitBadge} aria-label="Exit row">
                                        EXIT
                                    </span>
                                ) : null}
                            </span>
                            {columns.map((col, idx) => {
                                const seat = byKey.get(`${row}-${col}`)
                                if (!seat) {
                                    return (
                                        <React.Fragment key={`${row}-${col}`}>
                                            <span className={styles.seatEmpty} />
                                            {idx === aisleAfterIndex ? (
                                                <span className={styles.aisle} />
                                            ) : null}
                                        </React.Fragment>
                                    )
                                }

                                const available = isSeatAvailable(seat)
                                const selected = selectedKey === seat.ancillaryKey
                                const takenByOther = occupied.has(seat.ancillaryKey)
                                const isExit = (seat.characteristics || []).includes('exit row')
                                const label = seatLabels[seat.ancillaryKey]
                                const disabled = !available || (takenByOther && !label)
                                const canHover = (available && !takenByOther) || Boolean(label)
                                const showTip = hoverSeatKey === seat.ancillaryKey && canHover
                                const tipPassengerName =
                                    seatPassengerNames[seat.ancillaryKey] || passengerName || 'Passenger'
                                const className = [
                                    styles.seatBtn,
                                    !available && !label ? styles.seatBtnUnavailable : '',
                                    selected || label ? styles.seatBtnSelected : '',
                                    isExit || isExitRow ? styles.seatBtnExit : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')

                                return (
                                    <React.Fragment key={seat.ancillaryKey || `${row}-${col}`}>
                                        <span
                                            className={styles.seatCell}
                                            onMouseEnter={() => {
                                                if (canHover) setHoverSeatKey(seat.ancillaryKey)
                                            }}
                                            onMouseLeave={() => setHoverSeatKey(null)}
                                        >
                                            <button
                                                type="button"
                                                className={className}
                                                disabled={disabled}
                                                onClick={() => onSelect(seat)}
                                            >
                                                {label ? (
                                                    <span className={styles.seatPassengerTag}>{label}</span>
                                                ) : available ? (
                                                    <span className={styles.seatPrice}>
                                                        {formatSeatPrice(
                                                            seat.seatPrice,
                                                            seat.seatCurrency,
                                                            selectedCurrency,
                                                            rates
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className={styles.seatCross} aria-label="Taken">
                                                        ×
                                                    </span>
                                                )}
                                            </button>
                                            {showTip && (
                                                <div className={styles.seatTooltip} role="tooltip">
                                                    <p className={styles.seatTooltipTitle}>
                                                        Seat {seat.seatName}
                                                    </p>
                                                    <div className={styles.seatTooltipRow}>
                                                        <span>{tipPassengerName}</span>
                                                        <span>
                                                            {formatSeatPriceTooltip(
                                                                seat.seatPrice,
                                                                seat.seatCurrency,
                                                                selectedCurrency,
                                                                rates
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </span>
                                        {idx === aisleAfterIndex ? (
                                            <span className={styles.aisle} />
                                        ) : null}
                                    </React.Fragment>
                                )
                            })}
                            <span className={styles.exitMark}>
                                {isExitRow ? (
                                    <span className={styles.exitBadge} aria-label="Exit row">
                                        EXIT
                                    </span>
                                ) : null}
                            </span>
                            <span className={styles.rowLabel}>{row}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function IncludedAllowance({ included, headerAction = null }) {
    if (!included || (!included.cabin && !included.checked)) {
        return (
            <div className={styles.includedBox}>
                <div className={styles.includedHeader}>
                    <div className={styles.includedHeaderLeft}>
                        <span className={styles.includedBadge}>Included</span>
                        <h4 className={styles.includedTitle}>Already in your ticket</h4>
                    </div>
                    {headerAction}
                </div>
                <p className={styles.includedEmpty}>
                    No free baggage allowance is listed for this fare. You can add paid bags if needed.
                </p>
            </div>
        )
    }

    return (
        <div className={styles.includedBox}>
            <div className={styles.includedHeader}>
                <div className={styles.includedHeaderLeft}>
                    <span className={styles.includedBadge}>Included</span>
                    <h4 className={styles.includedTitle}>Already in your ticket</h4>
                </div>
                {headerAction}
            </div>
            <div className={styles.includedItems}>
                {included.cabin ? (
                    <div className={styles.includedItem}>
                        <span className={`${styles.includedIcon} ${styles.includedIconCabin}`}>
                            <FaSuitcase />
                        </span>
                        <div>
                            <p className={styles.includedLabel}>Carry-on</p>
                            <p className={styles.includedValue}>{included.cabin}</p>
                        </div>
                    </div>
                ) : null}
                {included.checked ? (
                    <div className={styles.includedItem}>
                        <span className={`${styles.includedIcon} ${styles.includedIconChecked}`}>
                            <FaSuitcase />
                        </span>
                        <div>
                            <p className={styles.includedLabel}>Checked</p>
                            <p className={styles.includedValue}>{included.checked}</p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.includedItem}>
                        <span className={`${styles.includedIcon} ${styles.includedIconMuted}`}>
                            <FaSuitcase />
                        </span>
                        <div>
                            <p className={styles.includedLabel}>Checked</p>
                            <p className={styles.includedValue}>Not included — add more if needed</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function BaggageStep({
    options,
    legs = [],
    passengers = [],
    selectedBaggage = {},
    activeLegId,
    onLegChange,
    onSelect,
    includedByLeg = {},
}) {
    const [expandedPassengerId, setExpandedPassengerId] = useState(passengers[0]?.id || '')
    const [filter, setFilter] = useState('all')
    const [openPickerKeys, setOpenPickerKeys] = useState({})

    const pickerKey = (passengerId, legId) => `${passengerId}::${legId}`

    useEffect(() => {
        if (!passengers.length) {
            setExpandedPassengerId('')
            return
        }
        // Only auto-select when current id is invalid (not when user collapsed = '')
        if (
            expandedPassengerId &&
            !passengers.some((p) => p.id === expandedPassengerId)
        ) {
            setExpandedPassengerId(passengers[0].id)
        }
    }, [passengers, expandedPassengerId])

    useEffect(() => {
        setFilter('all')
        setOpenPickerKeys({})
        // Keep accordion state; only reset filters when switching legs
    }, [activeLegId])

    if (!options?.length) {
        return <div className={styles.emptyBox}>No baggage options available for this flight.</div>
    }

    if (!passengers?.length) {
        return <div className={styles.emptyBox}>No passengers available for baggage selection.</div>
    }

    const activeLeg = legs.find((leg) => leg.id === activeLegId) || legs[0]
    const showLegPicker = legs.length > 1
    const legBaggageInfo = includedByLeg?.[activeLeg?.id] || null

    const cabinOptions = options.filter((option) => isCabinBag(option))
    const checkedOptions = options.filter((option) => !isCabinBag(option))
    const visibleOptions =
        filter === 'cabin' ? cabinOptions : filter === 'checked' ? checkedOptions : options

    const openPicker = (passengerId) => {
        const key = pickerKey(passengerId, activeLeg?.id)
        setOpenPickerKeys((prev) => ({ ...prev, [key]: true }))
    }

    const closePicker = (passengerId) => {
        const key = pickerKey(passengerId, activeLeg?.id)
        setOpenPickerKeys((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }

    return (
        <div className={styles.bagStep}>
            {showLegPicker && (
                <div className={styles.bagLegTabs}>
                    {legs.map((leg) => {
                        const isActive = leg.id === activeLeg?.id
                        const selectedCount = passengers.filter(
                            (p) => selectedBaggage?.[p.id]?.[leg.id]
                        ).length
                        return (
                            <button
                                key={leg.id}
                                type="button"
                                className={`${styles.bagLegTab}${isActive ? ` ${styles.bagLegTabActive}` : ''}`}
                                onClick={() => onLegChange(leg.id)}
                            >
                                <span className={styles.bagLegTabTop}>
                                    <span className={styles.bagLegLabel}>{leg.label}</span>
                                    {selectedCount > 0 && (
                                        <span className={styles.bagLegCount}>
                                            {selectedCount} selected
                                        </span>
                                    )}
                                </span>
                                <span className={styles.bagLegRoute}>
                                    {leg.from} → {leg.to}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            {!showLegPicker && activeLeg && (
                <p className={styles.bagLegHint}>
                    {activeLeg.from} → {activeLeg.to}
                </p>
            )}

            <div className={styles.bagPassengerList}>
                {passengers.map((passenger, index) => {
                    const selected = selectedBaggage?.[passenger.id]?.[activeLeg?.id]
                    const isExpanded = expandedPassengerId === passenger.id
                    const included = getIncludedForPassenger(legBaggageInfo, passenger.type)
                    const isPickerOpen =
                        !!openPickerKeys[pickerKey(passenger.id, activeLeg?.id)] || !!selected

                    return (
                        <div
                            key={passenger.id}
                            className={`${styles.bagPassengerBlock}${isExpanded ? ` ${styles.bagPassengerBlockOpen}` : ''}`}
                        >
                            <button
                                type="button"
                                className={styles.bagPassengerHeader}
                                onClick={() =>
                                    setExpandedPassengerId((prev) =>
                                        prev === passenger.id ? '' : passenger.id
                                    )
                                }
                                aria-expanded={isExpanded}
                            >
                                <span className={styles.bagPassengerHeaderText}>
                                    <span className={styles.bagPassengerName}>
                                        {passenger.name || `Passenger ${index + 1}`}
                                    </span>
                                    <span className={styles.bagPassengerMeta}>
                                        Passenger {index + 1}
                                        {selected
                                            ? ` · Extra: ${getBagWeightDisplay(selected)}`
                                            : ' · No extra bag selected'}
                                    </span>
                                </span>
                                <span className={styles.bagPassengerHeaderRight}>
                                    {selected ? (
                                        <span className={styles.bagSelectedPill}>
                                            +{getBagWeightDisplay(selected)}
                                        </span>
                                    ) : (
                                        <span className={styles.bagNonePill}>Included only</span>
                                    )}
                                    <IoChevronDown
                                        className={`${styles.bagPassengerChevron}${isExpanded ? ` ${styles.bagPassengerChevronOpen}` : ''}`}
                                    />
                                </span>
                            </button>

                            {isExpanded && (
                                <div className={styles.bagPassengerBody}>
                                    <IncludedAllowance
                                        included={included}
                                        headerAction={
                                            !isPickerOpen ? (
                                                <button
                                                    type="button"
                                                    className={styles.bagAddMoreBtn}
                                                    onClick={() => openPicker(passenger.id)}
                                                >
                                                    <span className={styles.bagAddMoreIcon}>+</span>
                                                    <span className={styles.bagAddMoreText}>
                                                        <strong>Add more</strong>
                                                    </span>
                                                </button>
                                            ) : null
                                        }
                                    />

                                    {isPickerOpen && (
                                        <>
                                            <div className={styles.bagExtraHeader}>
                                                <div>
                                                    <h5 className={styles.bagExtraTitle}>
                                                        Add extra baggage
                                                    </h5>
                                                    <p className={styles.bagExtraHint}>
                                                        Optional — pick one paid bag for this passenger.
                                                    </p>
                                                </div>
                                                <div className={styles.bagExtraActions}>
                                                    {(cabinOptions.length > 0 &&
                                                        checkedOptions.length > 0) && (
                                                        <div
                                                            className={styles.bagFilterTabs}
                                                            role="tablist"
                                                        >
                                                            {[
                                                                { id: 'all', label: 'All' },
                                                                { id: 'cabin', label: 'Cabin' },
                                                                {
                                                                    id: 'checked',
                                                                    label: 'Checked',
                                                                },
                                                            ].map((tab) => (
                                                                <button
                                                                    key={tab.id}
                                                                    type="button"
                                                                    role="tab"
                                                                    aria-selected={filter === tab.id}
                                                                    className={`${styles.bagFilterTab}${filter === tab.id ? ` ${styles.bagFilterTabActive}` : ''}`}
                                                                    onClick={() => setFilter(tab.id)}
                                                                >
                                                                    {tab.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {!selected && (
                                                        <button
                                                            type="button"
                                                            className={styles.bagHideBtn}
                                                            onClick={() => closePicker(passenger.id)}
                                                        >
                                                            Hide
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div
                                                className={styles.bagOptionList}
                                                role="radiogroup"
                                                aria-label="Baggage allowance options"
                                            >
                                                <button
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={!selected}
                                                    className={`${styles.bagOptionRow}${!selected ? ` ${styles.bagOptionRowSelected}` : ''}`}
                                                    onClick={() => {
                                                        if (selected) {
                                                            onSelect(
                                                                passenger.id,
                                                                activeLeg.id,
                                                                selected
                                                            )
                                                        }
                                                        closePicker(passenger.id)
                                                    }}
                                                >
                                                    <span
                                                        className={`${styles.bagOptionRadio}${!selected ? ` ${styles.bagOptionRadioOn}` : ''}`}
                                                        aria-hidden
                                                    />
                                                    <span className={styles.bagOptionMain}>
                                                        <span className={styles.bagOptionTitle}>
                                                            No extra bag
                                                        </span>
                                                        <span className={styles.bagOptionSub}>
                                                            Continue with the free allowance above
                                                        </span>
                                                    </span>
                                                    <span
                                                        className={`${styles.bagOptionPrice} ${styles.bagOptionPriceFree}`}
                                                    >
                                                        Free
                                                    </span>
                                                </button>

                                                {visibleOptions.map((option) => {
                                                    const isSelected =
                                                        selected?.ancillary_key ===
                                                        option.ancillary_key
                                                    const cabin = isCabinBag(option)
                                                    return (
                                                        <button
                                                            key={`${passenger.id}-${activeLeg?.id}-${option.ancillary_key}`}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={isSelected}
                                                            className={`${styles.bagOptionRow}${isSelected ? ` ${styles.bagOptionRowSelected}` : ''}`}
                                                            onClick={() =>
                                                                onSelect(
                                                                    passenger.id,
                                                                    activeLeg.id,
                                                                    option
                                                                )
                                                            }
                                                        >
                                                            <span
                                                                className={`${styles.bagOptionRadio}${isSelected ? ` ${styles.bagOptionRadioOn}` : ''}`}
                                                                aria-hidden
                                                            />
                                                            <span className={styles.bagOptionMain}>
                                                                <span
                                                                    className={styles.bagOptionTitleRow}
                                                                >
                                                                    <span
                                                                        className={styles.bagOptionTitle}
                                                                    >
                                                                        {getBagWeightDisplay(option)}
                                                                    </span>
                                                                    <span
                                                                        className={`${styles.bagOptionTag}${cabin ? ` ${styles.bagOptionTagCabin}` : ` ${styles.bagOptionTagChecked}`}`}
                                                                    >
                                                                        {cabin
                                                                            ? 'Cabin'
                                                                            : 'Checked'}
                                                                    </span>
                                                                </span>
                                                                <span className={styles.bagOptionSub}>
                                                                    {getBagPieceDetail(option)}
                                                                </span>
                                                            </span>
                                                            <span className={styles.bagOptionPrice}>
                                                                <PriceDisplay
                                                                    currency={option.currency}
                                                                    price={option.price}
                                                                />
                                                            </span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function SeatStep({
    seatSegments,
    segmentLookup,
    activeSegmentKey,
    onSegmentChange,
    passengers,
    activePassengerId,
    onPassengerChange,
    selectedSeats,
    onSelectSeat,
    passengersReady,
}) {
    const active = seatSegments.find((s) => s.segment_key === activeSegmentKey) || seatSegments[0]
    const nextAssignee =
        passengers.find((p) => !selectedSeats?.[p.id]?.[active?.segment_key]) ||
        passengers.find((p) => p.id === activePassengerId) ||
        passengers[0]
    const assigneeId = nextAssignee?.id || activePassengerId
    const selected = selectedSeats?.[assigneeId]?.[active?.segment_key]
    const activePassenger = passengers.find((p) => p.id === assigneeId) || nextAssignee

    const occupiedKeys = useMemo(
        () =>
            passengers
                .filter((p) => p.id !== assigneeId)
                .map((p) => selectedSeats?.[p.id]?.[active?.segment_key]?.ancillaryKey)
                .filter(Boolean),
        [passengers, assigneeId, selectedSeats, active?.segment_key]
    )

    const seatLabels = useMemo(() => {
        const labels = {}
        passengers.forEach((passenger, index) => {
            const seat = selectedSeats?.[passenger.id]?.[active?.segment_key]
            if (seat?.ancillaryKey) {
                labels[seat.ancillaryKey] = `P${index + 1}`
            }
        })
        return labels
    }, [passengers, selectedSeats, active?.segment_key])

    const seatPassengerNames = useMemo(() => {
        const names = {}
        passengers.forEach((passenger) => {
            const seat = selectedSeats?.[passenger.id]?.[active?.segment_key]
            if (seat?.ancillaryKey) {
                names[seat.ancillaryKey] = passenger.name
            }
        })
        return names
    }, [passengers, selectedSeats, active?.segment_key])

    if (!passengersReady) {
        return (
            <div className={styles.emptyBox}>
                Please complete passenger first and last names above before selecting seats.
            </div>
        )
    }

    if (!seatSegments?.length) {
        return <div className={styles.emptyBox}>No seat map available for this flight.</div>
    }

    if (!passengers?.length) {
        return <div className={styles.emptyBox}>No passengers available for seat selection.</div>
    }

    const handleSeatSelect = (seat) => {
        const segmentKey = active?.segment_key
        if (!segmentKey) return

        const owner = passengers.find(
            (p) => selectedSeats?.[p.id]?.[segmentKey]?.ancillaryKey === seat.ancillaryKey
        )

        // Clicking an already-selected seat deselects it
        if (owner) {
            onSelectSeat(owner.id, segmentKey, seat)
            const firstWithoutSeat =
                passengers.find((p) => {
                    if (p.id === owner.id) return true
                    return !selectedSeats?.[p.id]?.[segmentKey]
                }) || owner
            onPassengerChange(firstWithoutSeat.id)
            return
        }

        // Always fill the first passenger without a seat on this segment
        const targetPassenger =
            passengers.find((p) => !selectedSeats?.[p.id]?.[segmentKey]) ||
            passengers.find((p) => p.id === activePassengerId) ||
            passengers[0]

        if (!targetPassenger) return

        onSelectSeat(targetPassenger.id, segmentKey, seat)

        const nextWithoutSeat = passengers.find(
            (p) => p.id !== targetPassenger.id && !selectedSeats?.[p.id]?.[segmentKey]
        )
        onPassengerChange(nextWithoutSeat?.id || targetPassenger.id)
    }

    const seatsTotal = sumSelectedSeatPrices(selectedSeats)
    const seatsCurrency =
        firstSelectedSeatCurrency(selectedSeats) ||
        active?.seat_maps?.[0]?.seatCurrency ||
        'GBP'

    return (
        <div className={styles.seatLayout}>
            <div className={styles.seatStickyTop}>
                <SeatPickerBar
                    seatSegments={seatSegments}
                    segmentLookup={segmentLookup}
                    activeSegmentKey={active.segment_key}
                    onSegmentChange={onSegmentChange}
                    passengers={passengers}
                    activePassengerId={assigneeId}
                    onPassengerChange={onPassengerChange}
                    selectedSeats={selectedSeats}
                />

                <div className={styles.seatLegend}>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendSwatch} ${styles.legendAvailable}`} /> Available
                    </span>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendSwatch} ${styles.legendSelected}`} /> Selected
                    </span>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendSwatch} ${styles.legendUnavailable}`}>×</span> Taken
                    </span>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendSwatch} ${styles.legendExit}`} /> Exit row
                    </span>
                </div>
            </div>

            <div className={styles.seatScrollArea}>
                <SeatMap
                    seatMaps={active?.seat_maps || []}
                    selectedKey={selected?.ancillaryKey}
                    occupiedKeys={occupiedKeys}
                    seatLabels={seatLabels}
                    seatPassengerNames={seatPassengerNames}
                    passengerName={activePassenger?.name}
                    onSelect={handleSeatSelect}
                />
            </div>

            <div className={styles.seatStickyBottom}>
                {seatsTotal > 0 && (
                    <div className={styles.selectionSummary}>
                        <p className={styles.summaryText}>Total seats</p>
                        <p className={styles.summaryPrice}>
                            <PriceDisplay currency={seatsCurrency} price={seatsTotal} />
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AdditionalDetail({
    flightDetails,
    passengers = [],
    view = 'auto',
    embedded = false,
    onContinue,
    onBack,
    onSelectionsChange,
    onAvailabilityChange,
    hideBackButton = false,
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [pricingData, setPricingData] = useState(null)

    const [activeStep, setActiveStep] = useState('baggage')
    const [selectedBaggage, setSelectedBaggage] = useState({})
    const [activeBaggageLeg, setActiveBaggageLeg] = useState('outbound')
    const [selectedSeats, setSelectedSeats] = useState({})
    const [activeSeatSegment, setActiveSeatSegment] = useState('')
    const [activePassengerId, setActivePassengerId] = useState('')

    const shouldShow = hasAncillaryAvailability(flightDetails)
    const seatPassengers = useMemo(() => buildSeatPassengers(passengers), [passengers])
    const baggagePassengers = seatPassengers
    const passengersReady = seatPassengers.length > 0 && seatPassengers.every((p) => p.hasName)
    const baggageLegs = useMemo(() => buildBaggageLegs(flightDetails), [flightDetails])
    const includedBaggageByLeg = useMemo(
        () => getIncludedBaggageByLeg(flightDetails),
        [flightDetails]
    )

    useEffect(() => {
        if (!shouldShow || !flightDetails?.id) {
            onAvailabilityChange?.({
                ready: true,
                baggage: false,
                seats: false,
            })
            return
        }

        const ancillaryTypes = buildAncillaryTypes(flightDetails.ancillary_availability)
        if (!ancillaryTypes.length) {
            onAvailabilityChange?.({
                ready: true,
                baggage: false,
                seats: false,
            })
            return
        }

        let cancelled = false

        const fetchAncillaryPricing = async () => {
            setLoading(true)
            setError('')
            onAvailabilityChange?.({
                ready: false,
                baggage: false,
                seats: false,
            })
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/flights/ancillaries/pricing`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(buildPricingPayload(flightDetails)),
                    }
                )
                const response = await res.json()
                if (cancelled) return

                if (response?.success === false) {
                    setError(
                        response?.message ||
                            response?.error?.message ||
                            'Failed to load ancillary options'
                    )
                    setPricingData(null)
                    onAvailabilityChange?.({
                        ready: true,
                        baggage: false,
                        seats: false,
                    })
                    return
                }

                setPricingData(response)
            } catch (err) {
                if (cancelled) return
                setError(err?.message || 'Failed to load ancillary options')
                setPricingData(null)
                onAvailabilityChange?.({
                    ready: true,
                    baggage: false,
                    seats: false,
                })
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchAncillaryPricing()

        return () => {
            cancelled = true
        }
    }, [flightDetails?.id, shouldShow])

    const apiJourneys = useMemo(() => {
        const payload = normalizePricingPayload(pricingData)
        return payload?.journeys || []
    }, [pricingData])

    const journey = apiJourneys[0] || null

    const baggageOptions = useMemo(() => {
        if (!apiJourneys.length) return []
        // Prefer bags from active journey/leg when multiple journeys exist
        const journeyIndex =
            activeBaggageLeg === 'return' && apiJourneys.length > 1 ? 1 : 0
        const fromActive = apiJourneys[journeyIndex]?.ancillaries?.baggage || []
        if (fromActive.length) return fromActive
        return apiJourneys.flatMap((j) => j?.ancillaries?.baggage || [])
    }, [apiJourneys, activeBaggageLeg])

    const seatSegments = useMemo(
        () => apiJourneys.flatMap((j) => j?.ancillaries?.seat || []),
        [apiJourneys]
    )

    useEffect(() => {
        if (!onAvailabilityChange) return
        if (loading) return
        if (!shouldShow) return
        // Error path already reported ready:false options in fetch handler
        if (error) {
            onAvailabilityChange({
                ready: true,
                baggage: false,
                seats: false,
            })
            return
        }
        if (!pricingData) return

        const flags =
            flightDetails?.ancillary_availability ||
            pricingData?.data?.availability ||
            pricingData?.availability ||
            {}

        onAvailabilityChange({
            ready: true,
            baggage: flags?.paid_bag === true && baggageOptions.length > 0,
            seats: flags?.paid_seat === true && seatSegments.length > 0,
        })
    }, [
        loading,
        error,
        pricingData,
        baggageOptions.length,
        seatSegments.length,
        flightDetails?.ancillary_availability,
        shouldShow,
        onAvailabilityChange,
    ])

    const steps = useMemo(() => {
        const flags = flightDetails?.ancillary_availability || pricingData?.data?.availability || pricingData?.availability
        const showBag = flags?.paid_bag === true && (loading || baggageOptions.length > 0)
        const showSeat = flags?.paid_seat === true && (loading || seatSegments.length > 0)

        if (view === 'luggage') {
            if (!loading && (error || baggageOptions.length === 0)) return []
            return [{ id: 'baggage', name: 'Baggage allowance', hint: 'Choose bag allowance' }]
        }
        if (view === 'seats') {
            if (!loading && (error || seatSegments.length === 0)) return []
            return [{ id: 'seat', name: 'Seats', hint: 'Pick your seat' }]
        }

        if (!loading && (pricingData || error)) {
            return [
                ...(flags?.paid_bag === true && baggageOptions.length > 0
                    ? [{ id: 'baggage', name: 'Baggage allowance', hint: 'Choose bag allowance' }]
                    : []),
                ...(flags?.paid_seat === true && seatSegments.length > 0
                    ? [{ id: 'seat', name: 'Seats', hint: 'Pick your seat' }]
                    : []),
            ]
        }

        const list = []
        if (showBag || flags?.paid_bag === true) {
            list.push({ id: 'baggage', name: 'Baggage allowance', hint: 'Choose bag allowance' })
        }
        if (showSeat || flags?.paid_seat === true) {
            list.push({ id: 'seat', name: 'Seats', hint: 'Pick your seat' })
        }
        return list
    }, [flightDetails, pricingData, baggageOptions.length, seatSegments.length, loading, view, error])

    useEffect(() => {
        if (view === 'luggage') {
            setActiveStep('baggage')
            return
        }
        if (view === 'seats') {
            setActiveStep('seat')
            return
        }
        if (!steps.length) return
        if (!steps.some((s) => s.id === activeStep)) {
            setActiveStep(steps[0].id)
        }
    }, [steps, activeStep, view])

    useEffect(() => {
        if (!baggageLegs.length) return
        if (!baggageLegs.some((leg) => leg.id === activeBaggageLeg)) {
            setActiveBaggageLeg(baggageLegs[0].id)
        }
    }, [baggageLegs, activeBaggageLeg])

    useEffect(() => {
        if (seatSegments.length && !activeSeatSegment) {
            setActiveSeatSegment(seatSegments[0].segment_key)
        }
    }, [seatSegments, activeSeatSegment])

    useEffect(() => {
        if (!seatPassengers.length) {
            setActivePassengerId('')
            return
        }
        if (!seatPassengers.some((p) => p.id === activePassengerId)) {
            setActivePassengerId(seatPassengers[0].id)
        }
    }, [seatPassengers, activePassengerId])

    const handleSeatSegmentChange = (segmentKey) => {
        setActiveSeatSegment(segmentKey)
        if (seatPassengers.length) {
            setActivePassengerId(seatPassengers[0].id)
        }
    }

    const segmentLookup = useMemo(() => {
        const formatPlace = (city, code) => {
            const cityName = String(city || '').trim()
            const airportCode = String(code || '').trim()
            if (cityName && airportCode) return `${cityName} (${airportCode})`
            return cityName || airportCode || ''
        }

        const map = {}
        const apiSegments = apiJourneys.flatMap((j) => j?.segments || [])
        const flightSegments = flightDetails?.segments || []

        flightSegments.forEach((seg) => {
            const key = seg.segment_key
            const depCode = seg.departure?.airport_code
            const arrCode = seg.arrival?.airport_code
            const entry = {
                departure: depCode,
                arrival: arrCode,
                departureCity: seg.departure?.city,
                arrivalCity: seg.arrival?.city,
                departureLabel: formatPlace(seg.departure?.city, depCode),
                arrivalLabel: formatPlace(seg.arrival?.city, arrCode),
                route: `${formatPlace(seg.departure?.city, depCode)} → ${formatPlace(seg.arrival?.city, arrCode)}`,
                flightNum: `${seg.airline?.code || ''}${seg.flight_number || ''}`,
            }
            if (key) map[key] = entry
            if (depCode && arrCode) map[`${depCode}-${arrCode}`] = entry
        })

        apiSegments.forEach((seg) => {
            const key = seg.segmentKey
            const depCode = seg.departure
            const arrCode = seg.arrival
            const existing = map[key] || map[`${depCode}-${arrCode}`] || {}
            const entry = {
                departure: depCode,
                arrival: arrCode,
                departureCity: existing.departureCity,
                arrivalCity: existing.arrivalCity,
                departureLabel:
                    existing.departureLabel || formatPlace(existing.departureCity, depCode),
                arrivalLabel: existing.arrivalLabel || formatPlace(existing.arrivalCity, arrCode),
                route:
                    existing.route ||
                    `${formatPlace(existing.departureCity, depCode)} → ${formatPlace(existing.arrivalCity, arrCode)}`,
                flightNum: `${seg.airline || ''}${seg.flightNum || ''}`,
            }
            if (key) map[key] = entry
            if (depCode && arrCode) map[`${depCode}-${arrCode}`] = entry
        })

        return map
    }, [apiJourneys, flightDetails?.id])

    const selectedBagCount = countSelectedBags(selectedBaggage)
    const selectedSeatCount = countSelectedSeats(selectedSeats)
    const baggageTotal = sumSelectedBaggagePrices(selectedBaggage)
    const seatsTotal = sumSelectedSeatPrices(selectedSeats)
    const addOnTotal = baggageTotal + seatsTotal
    const addOnCurrency =
        firstSelectedBaggageCurrency(selectedBaggage) ||
        firstSelectedSeatCurrency(selectedSeats) ||
        flightDetails?.pricing?.currency ||
        'GBP'

    const baggageItems = useMemo(
        () => flattenBaggageSelections(selectedBaggage, baggagePassengers, baggageLegs),
        [selectedBaggage, baggagePassengers, baggageLegs]
    )

    const ancillaryPayload = useMemo(
        () =>
            buildAncillaryPayload({
                apiJourneys,
                passengers,
                selectedBaggage,
                selectedSeats,
                baggageLegs,
                flightDetails,
            }),
        [apiJourneys, passengers, selectedBaggage, selectedSeats, baggageLegs, flightDetails]
    )

    const seatSegmentsForOverview = useMemo(
        () =>
            seatSegments.map((seg) => {
                const info = segmentLookup[seg.segment_key] || {}
                return {
                    segment_key: seg.segment_key,
                    from: info.departureLabel || info.departure || 'Origin',
                    to: info.arrivalLabel || info.arrival || 'Destination',
                }
            }),
        [seatSegments, segmentLookup]
    )

    useEffect(() => {
        if (!onSelectionsChange) return
        onSelectionsChange({
            baggage: {
                byPassenger: selectedBaggage,
                items: baggageItems,
                legs: baggageLegs,
            },
            seats: selectedSeats,
            seatSegments: seatSegmentsForOverview,
            ancillary: ancillaryPayload,
            total: { currency: addOnCurrency, amount: addOnTotal },
        })
    }, [
        selectedBaggage,
        baggageItems,
        baggageLegs,
        selectedSeats,
        seatSegmentsForOverview,
        ancillaryPayload,
        addOnCurrency,
        addOnTotal,
        onSelectionsChange,
    ])

    if (!shouldShow) return null
    if (embedded && view !== 'luggage' && view !== 'seats') return null

    const stepIndex = Math.max(0, steps.findIndex((s) => s.id === activeStep))
    const isLastStep = stepIndex === steps.length - 1
    const headerStepId = view === 'luggage' ? 'baggage' : view === 'seats' ? 'seat' : activeStep

    const goNext = () => {
        if (embedded && onContinue) {
            onContinue()
            return
        }
        if (isLastStep) return
        setActiveStep(steps[stepIndex + 1].id)
    }

    const goBack = () => {
        if (embedded && onBack) {
            onBack()
            return
        }
        if (stepIndex > 0) setActiveStep(steps[stepIndex - 1].id)
    }

    const isSeatsView = (embedded && view === 'seats') || (!embedded && activeStep === 'seat')

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.card}${isSeatsView ? ` ${styles.cardFixed}` : ''}`}>
                {!loading && !error && (
                    <div className={styles.header}>
                        <StepSectionHeader stepId={headerStepId} />
                    </div>
                )}

                {!embedded && steps.length > 1 && (
                    <div className={styles.steps}>
                        {steps.map((step, idx) => {
                            const isActive = step.id === activeStep
                            const isDone = idx < stepIndex
                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    className={[
                                        styles.stepTab,
                                        isActive ? styles.stepTabActive : '',
                                        isDone ? styles.stepTabDone : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    onClick={() => setActiveStep(step.id)}
                                    disabled={loading}
                                >
                                    <span className={styles.stepIndex}>{isDone ? '✓' : idx + 1}</span>
                                    <span className={styles.stepLabel}>
                                        <span className={styles.stepName}>{step.name}</span>
                                        <span className={styles.stepHint}>{step.hint}</span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}

                <div className={`${styles.body}${isSeatsView ? ` ${styles.bodyFixed}` : ''}`}>
                    {loading && <div className={styles.loadingBox}>Loading baggage & seat options…</div>}
                    {!loading && error && <div className={styles.errorBox}>{error}</div>}

                    {!loading && !error && (
                        <>
                            {((embedded && view === 'luggage') || (!embedded && activeStep === 'baggage')) && (
                                <>
                                    <BaggageStep
                                        options={baggageOptions}
                                        legs={baggageLegs}
                                        passengers={baggagePassengers}
                                        selectedBaggage={selectedBaggage}
                                        activeLegId={activeBaggageLeg}
                                        onLegChange={setActiveBaggageLeg}
                                        includedByLeg={includedBaggageByLeg}
                                        onSelect={(passengerId, legId, option) => {
                                            setSelectedBaggage((prev) => {
                                                const passengerBags = { ...(prev[passengerId] || {}) }
                                                const current = passengerBags[legId]
                                                if (current?.ancillary_key === option.ancillary_key) {
                                                    delete passengerBags[legId]
                                                } else {
                                                    passengerBags[legId] = option
                                                }
                                                const next = { ...prev, [passengerId]: passengerBags }
                                                if (!Object.keys(passengerBags).length) {
                                                    delete next[passengerId]
                                                }
                                                return next
                                            })
                                        }}
                                    />
                                    {selectedBagCount > 0 && (
                                        <div className={styles.selectionSummary} style={{ marginTop: 18 }}>
                                            <p className={styles.summaryText}>Total extra baggage</p>
                                            <p className={styles.summaryPrice}>
                                                <PriceDisplay
                                                    currency={addOnCurrency}
                                                    price={baggageTotal}
                                                />
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {isSeatsView && (
                                <SeatStep
                                    seatSegments={seatSegments}
                                    segmentLookup={segmentLookup}
                                    activeSegmentKey={activeSeatSegment}
                                    onSegmentChange={handleSeatSegmentChange}
                                    passengers={seatPassengers}
                                    activePassengerId={activePassengerId}
                                    onPassengerChange={setActivePassengerId}
                                    selectedSeats={selectedSeats}
                                    passengersReady={passengersReady}
                                    onSelectSeat={(passengerId, segmentKey, seat) => {
                                        setSelectedSeats((prev) => {
                                            const passengerSeats = { ...(prev[passengerId] || {}) }
                                            const current = passengerSeats[segmentKey]
                                            if (current?.ancillaryKey === seat.ancillaryKey) {
                                                delete passengerSeats[segmentKey]
                                            } else {
                                                passengerSeats[segmentKey] = seat
                                            }
                                            const next = { ...prev, [passengerId]: passengerSeats }
                                            if (!Object.keys(passengerSeats).length) {
                                                delete next[passengerId]
                                            }
                                            return next
                                        })
                                    }}
                                />
                            )}

                            <div className={`${styles.footer}${isSeatsView ? ` ${styles.footerFixed}` : ''}`}>
                                {!hideBackButton && (
                                    <button
                                        type="button"
                                        className={`${styles.btn} ${styles.btnGhost}`}
                                        onClick={goBack}
                                        disabled={!embedded && stepIndex === 0}
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={`${styles.btn} ${styles.btnPrimary}${hideBackButton ? ` ${styles.btnPrimaryFull}` : ''}`}
                                    onClick={goNext}
                                >
                                    {((embedded && view === 'luggage') || (!embedded && activeStep === 'baggage')) &&
                                    selectedBagCount === 0
                                        ? 'Skip and continue'
                                        : ((embedded && view === 'seats') || (!embedded && activeStep === 'seat')) &&
                                            selectedSeatCount === 0
                                          ? 'Skip and continue'
                                          : embedded || isLastStep
                                            ? 'Continue'
                                            : `Continue to ${steps[stepIndex + 1]?.name?.toLowerCase() || 'next'}`}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
