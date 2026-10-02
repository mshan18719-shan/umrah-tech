import moment from 'moment';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';

/** Normalize flight trip type for booking / ancillary APIs */
export function getBookingTripType(flight) {
    const normalize = (value) =>
        String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, '_')

    const airTripType = normalize(flight?.search_criteria?.AirTripType)
    if (airTripType === 'multi_city' || airTripType === 'multicity') return 'multi_city'
    if (airTripType === 'one_way' || airTripType === 'oneway') return 'one_way'
    if (airTripType === 'return' || airTripType === 'round_trip' || airTripType === 'roundtrip') {
        return 'return'
    }

    const tripType = normalize(flight?.trip_type)
    if (tripType === 'multi_city' || tripType === 'multicity') return 'multi_city'
    if (tripType === 'one_way' || tripType === 'oneway') return 'one_way'
    if (tripType === 'return' || tripType === 'round_trip' || tripType === 'roundtrip') {
        return 'return'
    }

    // Default one_way — do not assume return when type is missing/unknown
    return 'one_way'
}

export const formatConvertedPrice = (price, originalCurrency, selectedCurrency, rates) => {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) {
        return { currency: originalCurrency || selectedCurrency, amount: 0, label: '0' };
    }

    const { newcurrency, newprice } = ConvertPrice(
        numericPrice,
        originalCurrency,
        selectedCurrency,
        rates
    );

    const amount = Number(newprice);
    const label = amount % 1 === 0 ? amount.toLocaleString() : Number(amount).toFixed(2);

    return {
        currency: newcurrency,
        amount,
        label: `${newcurrency} ${label}`,
    };
};

export const groupSegments = (flight) => {
    if (!flight?.segments?.length) return [];

    const withSegmentIndices = (segments, startIndex = 0) => ({
        segments,
        // API penalties.segment_index_list is 1-based
        segmentIndices: segments.map((_, i) => startIndex + i + 1),
    });

    const airportCode = (point) =>
        String(point?.airport_code || point?.iata_code || point?.code || '')
            .trim()
            .toUpperCase();

    const legDestination = (leg) =>
        String(leg?.destination || leg?.to || leg?.arrival || leg?.ArrivalCode || '')
            .trim()
            .toUpperCase();

    const legOrigin = (leg) =>
        String(leg?.origin || leg?.from || leg?.departure || leg?.DepartureCode || '')
            .trim()
            .toUpperCase();

    const groupByCriteriaLegs = (legs, labels = []) => {
        const groupedLegs = [];
        let segmentIndex = 0;

        legs.forEach((leg, legIndex) => {
            const legStartIndex = segmentIndex;
            const legSegments = [];
            const destination = legDestination(leg);

            while (segmentIndex < flight.segments.length) {
                const segment = flight.segments[segmentIndex];
                legSegments.push(segment);
                segmentIndex++;
                if (destination && airportCode(segment.arrival) === destination) break;
            }

            if (legSegments.length) {
                const origin = legOrigin(leg) || airportCode(legSegments[0]?.departure);
                const dest =
                    destination || airportCode(legSegments[legSegments.length - 1]?.arrival);
                groupedLegs.push({
                    ...withSegmentIndices(legSegments, legStartIndex),
                    label: labels[legIndex] || `Flight ${legIndex + 1}`,
                    origin,
                    destination: dest,
                });
            }
        });

        // If leftover segments remain, attach to last leg (avoids orphaned stop segments)
        if (groupedLegs.length && segmentIndex < flight.segments.length) {
            const last = groupedLegs[groupedLegs.length - 1];
            const extras = flight.segments.slice(segmentIndex);
            const start = last.segmentIndices?.[0] ? last.segmentIndices[0] - 1 : 0;
            const merged = [...last.segments, ...extras];
            groupedLegs[groupedLegs.length - 1] = {
                ...withSegmentIndices(merged, start),
                label: last.label,
                origin: last.origin,
                destination: airportCode(merged[merged.length - 1]?.arrival) || last.destination,
            };
        }

        return groupedLegs;
    };

    const tripType = getBookingTripType(flight);
    const legs =
        flight?.search_criteria?.legs ||
        flight?.legs ||
        flight?.flight_details?.search_criteria?.legs ||
        [];

    if (tripType === 'return') {
        if (legs.length === 0) {
            const midpoint = Math.ceil(flight.segments.length / 2);
            return [
                { ...withSegmentIndices(flight.segments.slice(0, midpoint), 0), label: 'Departure' },
                { ...withSegmentIndices(flight.segments.slice(midpoint), midpoint), label: 'Return' },
            ];
        }

        const groupedLegs = groupByCriteriaLegs(legs, ['Departure', 'Return']);
        return groupedLegs.length
            ? groupedLegs
            : [{ ...withSegmentIndices(flight.segments, 0), label: 'Departure' }];
    }

    if (tripType === 'multi_city') {
        if (legs.length > 0) {
            const groupedLegs = groupByCriteriaLegs(legs);
            if (groupedLegs.length > 0) return groupedLegs;
        }

        // Fallback without legs: keep connection stops together.
        // International hub stopovers often exceed 12h (e.g. ADD overnight);
        // use 24h — IATA-style connection window — before treating as a new leg.
        const LONG_LAYOVER_MINUTES = 24 * 60;
        const groupedLegs = [];
        let current = [];
        let startIndex = 0;

        flight.segments.forEach((segment, idx) => {
            if (!current.length) {
                startIndex = idx;
                current = [segment];
                return;
            }

            const prev = current[current.length - 1];
            const layover = moment(segment.departure?.datetime).diff(
                moment(prev.arrival?.datetime),
                'minutes'
            );
            const sameConnection =
                airportCode(prev.arrival) &&
                airportCode(prev.arrival) === airportCode(segment.departure) &&
                layover >= 0 &&
                layover < LONG_LAYOVER_MINUTES;

            if (sameConnection) {
                current.push(segment);
                return;
            }

            groupedLegs.push({
                ...withSegmentIndices(current, startIndex),
                label: `Flight ${groupedLegs.length + 1}`,
                origin: airportCode(current[0]?.departure),
                destination: airportCode(current[current.length - 1]?.arrival),
            });
            startIndex = idx;
            current = [segment];
        });

        if (current.length) {
            groupedLegs.push({
                ...withSegmentIndices(current, startIndex),
                label: `Flight ${groupedLegs.length + 1}`,
                origin: airportCode(current[0]?.departure),
                destination: airportCode(current[current.length - 1]?.arrival),
            });
        }

        return groupedLegs.length
            ? groupedLegs
            : [{ ...withSegmentIndices(flight.segments, 0), label: 'Flight 1' }];
    }

    return [{ ...withSegmentIndices(flight.segments, 0), label: 'Departure' }];
};

export const getPassengerCount = (flight) => {
    const counts = getTravelerCounts(flight);
    return counts.adult + counts.child + counts.infant;
};

export const getPassengerLabel = (flight) => {
    const counts = getTravelerCounts(flight);
    const { adult: adults, child: children, infant: infants } = counts;

    if (!adults && !children && !infants) return '';

    const parts = [];
    if (adults > 0) parts.push(`${adults} ${adults === 1 ? 'adult' : 'adults'}`);
    if (children > 0) parts.push(`${children} ${children === 1 ? 'child' : 'children'}`);
    if (infants > 0) parts.push(`${infants} ${infants === 1 ? 'infant' : 'infants'}`);

    return parts.join(', ');
};

export const getCompactPassengerLabel = (flight) => {
    const count = getPassengerCount(flight);
    if (!count) return '';
    return `${count} ${count === 1 ? 'passenger' : 'passengers'}`;
};

const PASSENGER_PENALTY_TYPES = ['adult', 'child', 'infant'];

const hasLegacyFlatPenalties = (penalties) =>
    !!(
        penalties?.refund_before_departure ||
        penalties?.change_before_departure ||
        penalties?.refund_after_departure ||
        penalties?.change_after_departure
    );

const pickPenaltyEntryForSegments = (entries, segmentIndices, allowUnscopedFallback = true) => {
    if (!Array.isArray(entries) || !entries.length) return null;

    const indices = Array.isArray(segmentIndices) ? segmentIndices : [];
    if (indices.length) {
        const matched = entries.find(
            (item) =>
                item &&
                typeof item === 'object' &&
                Array.isArray(item.segment_index_list) &&
                item.segment_index_list.some((idx) => indices.includes(idx))
        );
        if (matched) return matched;
    }

    // Caller didn't ask for a specific leg — use first entry
    if (!indices.length) {
        return entries[0] && typeof entries[0] === 'object' ? entries[0] : null;
    }

    // Asked for a leg but no match — optionally fall back when rules are not segment-scoped
    const hasSegmentScoped = entries.some(
        (item) => Array.isArray(item?.segment_index_list) && item.segment_index_list.length
    );
    if (hasSegmentScoped || !allowUnscopedFallback) return null;

    return entries[0] && typeof entries[0] === 'object' ? entries[0] : null;
};

/** Resolve penalties from new API shape (adult/child/infant arrays) or legacy flat object */
export const getPassengerPenaltiesMap = (penalties, segmentIndices, options = {}) => {
    if (!penalties || typeof penalties !== 'object') return {};

    const { allowUnscopedFallback = true } = options;
    const map = {};

    PASSENGER_PENALTY_TYPES.forEach((type) => {
        const entry = penalties[type];
        if (Array.isArray(entry)) {
            const picked = pickPenaltyEntryForSegments(entry, segmentIndices, allowUnscopedFallback);
            if (picked) map[type] = picked;
        } else if (entry && typeof entry === 'object' && allowUnscopedFallback) {
            map[type] = entry;
        }
    });

    // Legacy flat shape
    if (!Object.keys(map).length && allowUnscopedFallback && hasLegacyFlatPenalties(penalties)) {
        map.adult = penalties;
    }

    return map;
};

export const getPrimaryPassengerPenalties = (flight) => {
    const map = getPassengerPenaltiesMap(flight?.penalties);
    return map.adult || map.child || map.infant || null;
};

export const isNonRefundable = (flight) => {
    // Align with PolicyModal / getCancellationAirlineFee:
    // refund allowed === true → refundable; otherwise non-refundable.
    const map = getPassengerPenaltiesMap(flight?.penalties);
    const refundRules = Object.values(map)
        .map((entry) => entry?.refund_before_departure)
        .filter(Boolean);

    if (refundRules.length) {
        return !refundRules.some((rule) => rule.allowed === true);
    }

    const legacy = flight?.penalties?.refund_before_departure;
    if (legacy && typeof legacy === 'object') {
        return legacy.allowed !== true;
    }

    return false;
};

const PASSENGER_TYPE_LABELS = {
    adult: { singular: 'Adult', plural: 'Adults' },
    child: { singular: 'Child', plural: 'Children' },
    infant: { singular: 'Infant', plural: 'Infants' },
};

export const getTravelerCounts = (flight) => {
    const searchCriteria = flight?.search_criteria || {};
    const counts = {
        adult: Number(
            flight?.adults ?? searchCriteria.adult ?? searchCriteria.adults ?? 0
        ),
        child: Number(
            flight?.children ?? searchCriteria.child ?? searchCriteria.children ?? 0
        ),
        infant: Number(
            flight?.infants ?? searchCriteria.infant ?? searchCriteria.infants ?? 0
        ),
    };

    if (counts.adult || counts.child || counts.infant) {
        return counts;
    }

    // When adt/chd/inf fare fields exist, skip passenger_pricing —
    // it often labels every passenger as adult.
    const pricing = flight?.pricing;
    const hasTypeFares =
        pricing &&
        [pricing.adtFare, pricing.chdFare, pricing.infFare, pricing.adtTax, pricing.chdTax, pricing.infTax].some(
            (value) => value != null && Number(value) > 0
        );

    if (hasTypeFares) {
        return counts;
    }

    (flight?.passenger_pricing || []).forEach((pp) => {
        const type = pp.passenger_type || 'adult';
        if (!(type in counts)) return;
        counts[type] += Number(pp.quantity) || 1;
    });

    return counts;
};

/** True when pricing has per-type adult/child/infant fare or tax fields */
export const hasPerTravelerPricing = (flight) => {
    const pricing = flight?.pricing;
    if (!pricing) return false;

    const values = [
        pricing.adtFare,
        pricing.adtTax,
        pricing.chdFare,
        pricing.chdTax,
        pricing.infFare,
        pricing.infTax,
    ];

    return values.some((value) => value != null && Number(value) > 0);
};

/**
 * Expandable traveler groups when adt/chd/inf pricing exists.
 * Returns [] when per-type pricing is not available.
 * Markup is folded into Flight fare so it is not shown separately.
 */
export const getTravelerPricingGroups = (flight) => {
    if (!hasPerTravelerPricing(flight)) return [];

    const pricing = flight.pricing;
    const currency = pricing?.currency;
    const counts = getTravelerCounts(flight);
    const groups = [];

    const resolveCount = (count, unitFare, unitTax) => {
        const hasPrice = Number(unitFare || 0) > 0 || Number(unitTax || 0) > 0;
        if (count > 0) return count;
        // Pricing exists for this type but count missing → treat as 1
        return hasPrice ? 1 : 0;
    };

    const addGroup = (type, count, unitFare, unitTax) => {
        const resolvedCount = resolveCount(count, unitFare, unitTax);
        if (!resolvedCount) return;

        // Unit amounts are per traveler; multiply by count
        const fare = Number(unitFare || 0) * resolvedCount;
        const tax = Number(unitTax || 0) * resolvedCount;
        const ticketFee = Number(pricing.tktFee || 0);
        if (fare <= 0 && tax <= 0) return;

        const labels = PASSENGER_TYPE_LABELS[type];
        const name = resolvedCount === 1 ? labels.singular : labels.plural;

        groups.push({
            key: type,
            label: `${name} (${resolvedCount})`,
            fare: fare + ticketFee,
            tax,
            total: fare + tax + ticketFee,
            currency,
        });
    };

    addGroup('adult', counts.adult, pricing.adtFare, pricing.adtTax);
    addGroup('child', counts.child, pricing.chdFare, pricing.chdTax);
    addGroup('infant', counts.infant, pricing.infFare, pricing.infTax);

    // Silently distribute markup into each traveler's flight fare
    const totalMarkup = Number(pricing?.markup_details?.total_markup_amount || 0);
    if (totalMarkup > 0 && groups.length) {
        const subtotal = groups.reduce((sum, group) => sum + group.total, 0);
        let allocated = 0;

        groups.forEach((group, index) => {
            const isLast = index === groups.length - 1;
            const share = isLast
                ? Number((totalMarkup - allocated).toFixed(2))
                : subtotal > 0
                  ? Number(((group.total / subtotal) * totalMarkup).toFixed(2))
                  : 0;

            if (!isLast) allocated += share;

            group.fare = Number((group.fare + share).toFixed(2));
            group.total = Number((group.fare + group.tax).toFixed(2));
        });
    }

    return groups;
};

export const getPassengerPricingRows = (flight, selectedCurrency, rates = {}) => {
    const pricing = flight?.pricing;
    const originalCurrency = pricing?.currency;
    const cabinClass = flight?.segments?.[0]?.cabin_class?.name || '';

    const buildRow = (type, count, unitPrice, totalPrice) => {
        const convertedUnit = formatConvertedPrice(unitPrice, originalCurrency, selectedCurrency, rates);
        const labels = PASSENGER_TYPE_LABELS[type] || {
            singular: type.charAt(0).toUpperCase() + type.slice(1),
            plural: `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
        };
        const name = count === 1 ? labels.singular : labels.plural;

        return {
            key: type,
            label: `${count} ${name}${cabinClass ? `, ${cabinClass}` : ''}`,
            quantityLabel: `${count} × ${convertedUnit.label}`,
            amount: totalPrice,
            currency: originalCurrency,
        };
    };
    
    if (flight?.passenger_pricing?.length) {
        const grouped = {};

        flight.passenger_pricing.forEach((pp) => {
            const type = pp.passenger_type || 'adult';
            const quantity = Number(pp.quantity) || 1;
            if (!grouped[type]) {
                grouped[type] = { count: 0, unitPrice: 0, totalPrice: 0 };
            }
            grouped[type].count += quantity;
            grouped[type].unitPrice = Number(pp.base_amount || pp.amount || pp.price || 0);
            grouped[type].totalPrice += Number(pp.base_amount || pp.amount || pp.price || 0);
        });

        return Object.entries(grouped).map(([type, data]) =>
            buildRow(type, data.count, data.unitPrice, data.totalPrice)
        );
    }

    const counts = getTravelerCounts(flight);
    const rows = [];
    const baseAmount =
        Number(pricing?.base_amount || 0) + Number(pricing?.markup_details?.total_markup_amount || 0);
    const passengerCount =
        counts.adult + counts.child + counts.infant || getPassengerCount(flight) || 1;

    const addRow = (count, type) => {
        if (!count) return;
        const unitPrice = baseAmount / passengerCount;
        rows.push(buildRow(type, count, unitPrice, unitPrice * count));
    };

    addRow(counts.adult, 'adult');
    addRow(counts.child, 'child');
    addRow(counts.infant, 'infant');

    if (!rows.length) {
        rows.push(buildRow('adult', 1, baseAmount, baseAmount));
    }

    return rows;
};

export const formatAmount = (amount) => {
    const value = Number(amount);
    if (Number.isNaN(value)) return '0';
    return value % 1 === 0 ? value.toLocaleString() : value.toFixed(2);
};

export const formatRouteDate = (datetime) => moment(datetime).format('ddd, D MMM');

export const getAirlineFeeLabel = (penalty, selectedCurrency, rates = {}) => {
    if (!penalty) return '—';
    if (!penalty.allowed) return 'Not permitted';

    if (penalty.penalty_amount && Number(penalty.penalty_amount) > 0) {
        return formatConvertedPrice(
            penalty.penalty_amount,
            penalty.penalty_currency,
            selectedCurrency,
            rates
        ).label;
    }

    return 'No fee';
};

export const getCancellationAirlineFee = (penalty, selectedCurrency, rates = {}) => {
    if (!penalty) return '—';
    if (!penalty.allowed) return 'Non-refundable';

    if (penalty.penalty_amount && Number(penalty.penalty_amount) > 0) {
        return formatConvertedPrice(
            penalty.penalty_amount,
            penalty.penalty_currency,
            selectedCurrency,
            rates
        ).label;
    }

    return 'No fee';
};

/** Label for a single penalty cell in the policy tables (kind: 'change' | 'refund') */
export const formatPolicyFeeLabel = (penalty, kind, selectedCurrency, rates = {}) => {
    if (!penalty || typeof penalty !== 'object') return '—';
    if (penalty.allowed !== true) {
        return kind === 'refund' ? 'Not refundable' : 'Not permitted';
    }

    if (penalty.penalty_amount && Number(penalty.penalty_amount) > 0) {
        return formatConvertedPrice(
            penalty.penalty_amount,
            penalty.penalty_currency,
            selectedCurrency,
            rates
        ).label;
    }

    return 'Free';
};

const getSegmentIndicesForLeg = (flight, segments = []) => {
    const all = Array.isArray(flight?.segments) ? flight.segments : [];
    // API penalties.segment_index_list is 1-based
    return segments.map((seg) => all.indexOf(seg) + 1).filter((idx) => idx > 0);
};

/** One row per passenger type for a leg: { key, passenger, before, after } */
export const getLegPassengerPolicyRows = (flight, segments = [], groupIndex = 0, kind = 'refund') => {
    const indices = getSegmentIndicesForLeg(flight, segments);
    const map = getPassengerPenaltiesMap(flight?.penalties, indices);
    const counts = getTravelerCounts(flight);
    const hasCounts = counts.adult + counts.child + counts.infant > 0;

    return PASSENGER_PENALTY_TYPES.filter((type) => map[type] && (!hasCounts || counts[type] > 0))
        .map((type) => ({
            key: `${type}-${groupIndex}`,
            passenger: type,
            before: map[type][`${kind}_before_departure`] || null,
            after: map[type][`${kind}_after_departure`] || null,
        }))
        .filter((row) => row.before || row.after);
};

const normalizeLegBaggage = (entry) => {
    const baggage = Array.isArray(entry) ? entry[0] : entry;
    if (!baggage || typeof baggage !== 'object') return null;
    const cabin = String(baggage.cabin || '').trim();
    const checked = String(baggage.checked || '').trim();
    if (!cabin && !checked) return null;
    return { cabin, checked };
};

/** Included baggage rows for a leg: { key, service, passenger, detail } */
export const getLegBaggageRows = (flight, segments = [], groupIndex = 0) => {
    const segment = segments.find((seg) => seg?.baggage_info) || segments[0];
    const info = segment?.baggage_info;
    if (!info || typeof info !== 'object') return [];

    const counts = getTravelerCounts(flight);
    const hasCounts = counts.adult + counts.child + counts.infant > 0;
    const rows = [];

    PASSENGER_PENALTY_TYPES.forEach((type) => {
        if (hasCounts && !counts[type]) return;
        const bag = normalizeLegBaggage(info[type]);
        if (!bag) return;
        if (bag.cabin) {
            rows.push({
                key: `${type}-cabin-${groupIndex}`,
                service: 'Cabin baggage',
                passenger: type,
                detail: bag.cabin,
            });
        }
        if (bag.checked) {
            rows.push({
                key: `${type}-checked-${groupIndex}`,
                service: 'Checked baggage',
                passenger: type,
                detail: bag.checked,
            });
        }
    });

    return rows;
};

export const isCabinBag = (option) => {
    if (Number(option?.pay_baggage_type) === 2) return true;
    const text = `${option?.description || ''} ${option?.baggage_type || ''} ${option?.type || ''}`;
    return /cabin|carry[\s-]?on/i.test(text);
};

export const formatBaggageWeight = (weight) => {
    const raw = String(weight ?? '').trim();
    if (!raw) return '';
    if (/^0(\s*kg)?$/i.test(raw)) return '';
    return /kg/i.test(raw) ? raw : `${raw}KG`;
};

export const getBaggageLabel = (option) => {
    if (!option) return 'Baggage';
    const weight = formatBaggageWeight(option?.baggage_weight);
    const description = String(option?.description || '').trim();
    const cleanDescription =
        description && !/[\u4e00-\u9fff]/.test(description) ? description : '';

    if (isCabinBag(option)) {
        return weight || cleanDescription || 'Cabin bag';
    }

    return weight || cleanDescription || 'Checked bag';
};

const ancillaryAirportCode = (point) => {
    if (!point) return '';
    if (typeof point === 'string') return String(point).trim().toUpperCase();
    return String(
        point.airport_code || point.iata_code || point.code || point || ''
    )
        .trim()
        .toUpperCase();
};

const ancillaryAirlineCode = (airline) => {
    if (!airline) return '';
    if (typeof airline === 'string') return airline.trim().toUpperCase();
    return String(airline.iata_code || airline.code || '').trim().toUpperCase();
};

const resolveSeatName = (seat = {}) => {
    const name = String(
        seat.seatName ||
            seat.seat_name ||
            seat.seatNum ||
            seat.seat_num ||
            seat.seat_number ||
            seat.seatNo ||
            (typeof seat.seat === 'string' || typeof seat.seat === 'number' ? seat.seat : '') ||
            ''
    ).trim();
    if (name) return name;
    const row = seat.row ?? seat.seat_row;
    const column = seat.column ?? seat.seat_column;
    if (row != null && column) return `${row}${column}`;
    return '';
};

/** Window / aisle / middle from API characteristics or seat column */
export const inferSeatPosition = (seat = {}) => {
    const chars = Array.isArray(seat.characteristics)
        ? seat.characteristics
        : Array.isArray(seat.seat_characteristics)
          ? seat.seat_characteristics
          : [];
    const charStr = chars.join(' ').toLowerCase();
    if (/window/i.test(charStr)) return 'Window';
    if (/aisle/i.test(charStr)) return 'Aisle';
    if (/middle|centre|center/i.test(charStr)) return 'Middle';

    const seatName = resolveSeatName(seat);
    const col = String(seat.column || seatName.replace(/\d+/g, '') || '')
        .trim()
        .toUpperCase();
    const letter = col.slice(-1);
    if (['A', 'F', 'K'].includes(letter)) return 'Window';
    if (['C', 'D', 'G', 'H'].includes(letter)) return 'Aisle';
    if (['B', 'E'].includes(letter)) return 'Middle';
    return '';
};

const normalizeFlightLabel = (label) =>
    String(label || '')
        .replace(/\s+/g, '')
        .toUpperCase();

const buildRouteLabel = (departure, arrival) => {
    const dep = ancillaryAirportCode(departure);
    const arr = ancillaryAirportCode(arrival);
    if (dep && arr) return `${dep} - ${arr}`;
    return dep || arr || '';
};

const buildFlightLabelFromParts = (airline, flightNum) => {
    const code = ancillaryAirlineCode(airline) || String(airline || '').trim().toUpperCase();
    const num = String(flightNum != null && flightNum !== '' ? flightNum : '').trim();
    if (code && num) return `${code} ${num}`;
    return code || num || '';
};

export const getBookingPassengerName = (detail, passengerIndex) => {
    const passengers = detail?.passenger_details || [];
    const passenger =
        passengers[passengerIndex] ??
        passengers.find(
            (p, idx) =>
                Number(p.passenger_index) === passengerIndex ||
                Number(p.index) === passengerIndex ||
                idx === passengerIndex
        );
    if (!passenger) return `Passenger ${passengerIndex + 1}`;
    const title = passenger.title ? `${String(passenger.title).toUpperCase()} ` : '';
    return `${title}${passenger.firstName || ''} ${passenger.lastName || ''}`.trim();
};

export const getBookingSegmentMeta = (segment, segmentIndex = 0) => {
    if (!segment) {
        return {
            segmentIndex,
            segmentKey: '',
            flightLabel: '',
            route: '',
            departureCode: '',
            arrivalCode: '',
        };
    }

    const departure =
        segment.origin ||
        segment.departure ||
        segment.departure?.airport_code ||
        segment.departure;
    const arrival =
        segment.destination ||
        segment.arrival ||
        segment.arrival?.airport_code ||
        segment.arrival;

    const airline = segment.airline;
    const flightNum = segment.flight_number ?? segment.flightNum;

    return {
        segmentIndex,
        segmentKey: String(segment.segment_key || segment.segmentKey || '').trim(),
        flightLabel: buildFlightLabelFromParts(airline, flightNum),
        route: buildRouteLabel(departure, arrival),
        departureCode: ancillaryAirportCode(departure),
        arrivalCode: ancillaryAirportCode(arrival),
    };
};

const metaFromAncillarySegment = (seg = {}) => {
    const flightLabel = buildFlightLabelFromParts(seg.airline, seg.flightNum || seg.flight_number);
    const route = buildRouteLabel(seg.departure, seg.arrival);
    return {
        segmentKey: String(seg.segmentKey || seg.segment_key || '').trim(),
        flightLabel,
        route,
        departureCode: ancillaryAirportCode(seg.departure),
        arrivalCode: ancillaryAirportCode(seg.arrival),
    };
};

const routesFromJourneySegments = (segments = []) => {
    const routes = (segments || [])
        .map((seg) => buildRouteLabel(seg?.departure, seg?.arrival))
        .filter(Boolean);
    return [...new Set(routes)];
};

const parseBagItem = (bag, ctx) => {
    if (!bag || typeof bag !== 'object') return null;
    const label = getBaggageLabel(bag);
    const price = Number(bag.price ?? bag.amount ?? bag.seatPrice ?? 0);
    const currency = bag.currency || bag.seatCurrency || ctx.defaultCurrency || '';
    const routes =
        ctx.routes?.length > 0
            ? ctx.routes
            : [buildRouteLabel(bag.departure, bag.arrival)].filter(Boolean);

    return {
        passengerIndex: ctx.passengerIndex,
        passengerName: ctx.passengerName,
        label,
        price: Number.isFinite(price) ? price : 0,
        currency,
        routes,
        ancillaryKey: bag.ancillary_key || bag.ancillaryKey || '',
    };
};

const parseSeatItem = (seat, ctx) => {
    if (!seat || typeof seat !== 'object') return null;
    const seatName = resolveSeatName(seat);
    if (!seatName) return null;

    const segMeta = metaFromAncillarySegment(seat.segment || {});
    const price = Number(seat.seatPrice ?? seat.price ?? seat.amount ?? 0);
    const currency = seat.seatCurrency || seat.currency || ctx.defaultCurrency || '';
    const hasPrice = [seat.seatPrice, seat.price, seat.amount].some(
        (value) => value != null && value !== ''
    );
    // Flat seat shape: { airline: 'VF', flightNum: '1990', seatNum: '2B' }
    const directFlightNum = seat.flightNum ?? seat.flight_number ?? seat.flightNumber;
    const directFlightLabel =
        seat.airline && directFlightNum != null && directFlightNum !== ''
            ? buildFlightLabelFromParts(seat.airline, directFlightNum)
            : '';

    return {
        passengerIndex: ctx.passengerIndex,
        passengerName: ctx.passengerName,
        seatName,
        price: Number.isFinite(price) ? price : 0,
        hasPrice,
        currency,
        flightLabel: segMeta.flightLabel || directFlightLabel || ctx.flightLabel || '',
        route: segMeta.route || ctx.route || '',
        position: inferSeatPosition(seat),
        segmentKey: segMeta.segmentKey || ctx.segmentKey || '',
        departureCode: segMeta.departureCode || ctx.departureCode || '',
        arrivalCode: segMeta.arrivalCode || ctx.arrivalCode || '',
        ancillaryKey: seat.ancillaryKey || seat.ancillary_key || '',
    };
};

const pushUnique = (list, item, keyFn) => {
    if (!item) return;
    const key = keyFn(item);
    if (!key || list.some((existing) => keyFn(existing) === key)) return;
    list.push(item);
};

const isBagLikeService = (item) => {
    if (!item || typeof item !== 'object') return false;
    return Boolean(
        item.ancillary_key ||
            item.ancillaryKey ||
            item.baggage_weight != null ||
            item.pay_baggage_type != null ||
            item.baggage_piece != null ||
            /bag/i.test(String(item.type || item.service_type || ''))
    );
};

const isSeatLikeService = (item) => {
    if (!item || typeof item !== 'object') return false;
    return Boolean(
        resolveSeatName(item) ||
            item.ancillaryKey ||
            item.ancillary_key ||
            /seat/i.test(String(item.type || item.service_type || ''))
    );
};

const normalizeNameKey = (value) =>
    String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

/** Same index rule the voucher/invoice pages use for passenger_details rows */
const getPassengerIndexOf = (passenger, arrayIndex) =>
    Number(passenger?.passenger_index ?? passenger?.index ?? arrayIndex);

/** Paid ancillary rows reference a passenger by name ({ passenger: { first_name, last_name } }) */
const resolvePaidPassengerIndex = (detail, entry) => {
    const passengers = detail?.passenger_details || [];
    const p = entry?.passenger || {};
    const first = p.first_name ?? p.firstName ?? entry?.first_name ?? entry?.firstName ?? '';
    const last = p.last_name ?? p.lastName ?? entry?.last_name ?? entry?.lastName ?? '';
    const fullName = normalizeNameKey(`${first} ${last}`);

    if (fullName) {
        const byName = passengers.findIndex(
            (pp) =>
                normalizeNameKey(
                    `${pp.firstName ?? pp.first_name ?? ''} ${pp.lastName ?? pp.last_name ?? ''}`
                ) === fullName
        );
        if (byName >= 0) return getPassengerIndexOf(passengers[byName], byName);
    }

    const rawIndex =
        entry?.passenger_index ?? entry?.passengerIndex ?? p.passenger_index ?? p.passengerIndex ?? p.index;
    if (rawIndex != null && rawIndex !== '' && Number.isFinite(Number(rawIndex))) {
        const byField = passengers.findIndex((pp) =>
            [pp.passenger_index, pp.passengerIndex, pp.index].some(
                (v) => v != null && Number(v) === Number(rawIndex)
            )
        );
        if (byField >= 0) return getPassengerIndexOf(passengers[byField], byField);
        return Number(rawIndex);
    }
    return 0;
};

const firstDefined = (...values) => values.find((v) => v != null && v !== '');

/** Collect flight labels ("VF 1990") an ancillary entry applies to */
const extractFlightLabels = (entry = {}) => {
    const labels = [];
    const add = (label) => {
        const clean = String(label || '').trim();
        if (clean && !labels.some((l) => normalizeFlightLabel(l) === normalizeFlightLabel(clean))) {
            labels.push(clean);
        }
    };
    const fromObject = (obj) => {
        if (!obj) return;
        if (typeof obj === 'string') return add(obj);
        const num = obj.flightNum ?? obj.flight_number ?? obj.flightNumber;
        if (obj.airline && num != null && num !== '') {
            add(buildFlightLabelFromParts(obj.airline, num));
        } else if (obj.flight_label || obj.flightLabel || obj.flight) {
            add(obj.flight_label || obj.flightLabel || obj.flight);
        }
    };

    ['flights', 'segments', 'flight_list', 'flightList'].forEach((key) => {
        if (Array.isArray(entry[key])) entry[key].forEach(fromObject);
    });
    fromObject(entry);
    if (entry.segment && typeof entry.segment === 'object') {
        add(metaFromAncillarySegment(entry.segment).flightLabel);
    }
    return labels;
};

const getPaidBagLabel = (entry = {}) => {
    const description = String(entry.description || '').trim();
    const cleanDescription = description && !/[\u4e00-\u9fff]/.test(description) ? description : '';
    if (cleanDescription && /bag/i.test(cleanDescription)) return cleanDescription;

    const named = String(entry.label || entry.name || entry.title || entry.baggage_name || '').trim();
    if (named && /bag/i.test(named)) return named;

    const weight = formatBaggageWeight(
        firstDefined(entry.baggage_weight, entry.baggageWeight, entry.weight, entry.kg)
    ).replace(/KG$/i, 'kg');
    const cabin = isCabinBag(entry);
    if (weight) return `${cabin ? 'Cabin' : 'Checked'} baggage ${weight}`;

    return named || cleanDescription || (cabin ? 'Cabin baggage' : 'Checked baggage');
};

const flattenPaidEntry = (entry, nestedKey) => {
    const nested =
        entry?.[nestedKey] && typeof entry[nestedKey] === 'object' && !Array.isArray(entry[nestedKey])
            ? entry[nestedKey]
            : {};
    return { ...(entry?.details && typeof entry.details === 'object' ? entry.details : {}), ...nested, ...entry };
};

const parsePaidBagItem = (entry, ctx) => {
    if (!entry || typeof entry !== 'object') return null;
    const flat = flattenPaidEntry(entry, 'baggage');
    const priceRaw = firstDefined(
        flat.price,
        flat.amount,
        flat.baggage_price,
        flat.baggagePrice,
        flat.fee,
        flat.total
    );
    const price = Number(priceRaw);
    const routes = [buildRouteLabel(flat.departure || flat.origin, flat.arrival || flat.destination)].filter(
        Boolean
    );

    return {
        passengerIndex: ctx.passengerIndex,
        passengerName: ctx.passengerName,
        label: getPaidBagLabel(flat),
        price: Number.isFinite(price) ? price : 0,
        hasPrice: priceRaw != null,
        currency: flat.currency || ctx.defaultCurrency || '',
        routes,
        flightLabels: extractFlightLabels(flat),
        ancillaryKey: flat.ancillary_key || flat.ancillaryKey || '',
    };
};

/**
 * baggage_info.paid = { currency, baggage: [...], seat: [...] } — paid extras with
 * the passenger referenced by name. Seats are merged into the seats already read from
 * passenger_details[].seats (adds the price); baggage is only used when no other source
 * supplied extra baggage, so nothing is counted twice.
 */
const collectFromPaidBaggageInfo = (detail, seatItems, bagItems, defaultCurrency) => {
    const paid = detail?.baggage_info?.paid;
    if (!paid || typeof paid !== 'object') return;
    const currency = paid.currency || defaultCurrency;

    (Array.isArray(paid.seat) ? paid.seat : []).forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        const passengerIndex = resolvePaidPassengerIndex(detail, entry);
        const ctx = {
            passengerIndex,
            passengerName: getBookingPassengerName(detail, passengerIndex),
            defaultCurrency: currency,
        };
        const parsed = parseSeatItem(flattenPaidEntry(entry, 'seat'), ctx);
        if (!parsed) return;

        const sameFlight = (a, b) =>
            !a || !b || normalizeFlightLabel(a) === normalizeFlightLabel(b);
        const existing = seatItems.find(
            (s) =>
                s.passengerIndex === passengerIndex &&
                s.seatName === parsed.seatName &&
                sameFlight(s.flightLabel, parsed.flightLabel) &&
                !s.hasPrice
        );

        if (existing) {
            existing.price = parsed.price;
            existing.hasPrice = parsed.hasPrice;
            existing.currency = parsed.currency || existing.currency || currency;
            existing.flightLabel = existing.flightLabel || parsed.flightLabel;
            existing.route = existing.route || parsed.route;
            existing.segmentKey = existing.segmentKey || parsed.segmentKey;
            return;
        }

        pushUnique(seatItems, parsed, (s) =>
            `seat:${s.passengerIndex}:${s.segmentKey}:${normalizeFlightLabel(s.flightLabel)}:${s.seatName}`
        );
    });

    if (bagItems.length === 0) {
        (Array.isArray(paid.baggage) ? paid.baggage : []).forEach((entry, idx) => {
            const passengerIndex = resolvePaidPassengerIndex(detail, entry);
            const item = parsePaidBagItem(entry, {
                passengerIndex,
                passengerName: getBookingPassengerName(detail, passengerIndex),
                defaultCurrency: currency,
            });
            if (item) item.paidIndex = idx; // keeps identical bags bought for different legs separate
            pushUnique(bagItems, item, (b) => `paidbag:${b.paidIndex}`);
        });
    }
};

/** Give each seat the route / segment key of the booked segment it belongs to */
const enrichSeatsFromSegments = (detail, seatItems) => {
    const segments = Array.isArray(detail?.segments) ? detail.segments : [];
    if (!segments.length) return;

    seatItems.forEach((seat) => {
        if (!seat.flightLabel || (seat.route && seat.segmentKey)) return;
        const matchIndex = segments.findIndex(
            (segment, idx) =>
                normalizeFlightLabel(getBookingSegmentMeta(segment, idx).flightLabel) ===
                normalizeFlightLabel(seat.flightLabel)
        );
        if (matchIndex < 0) return;
        const meta = getBookingSegmentMeta(segments[matchIndex], matchIndex);
        if (!seat.route) seat.route = meta.route;
        if (!seat.segmentKey) seat.segmentKey = meta.segmentKey;
    });
};

const collectFromJourneys = (journeys, detail, seatItems, bagItems, defaultCurrency) => {
    (journeys || []).forEach((journey) => {
        const journeyRoutes = routesFromJourneySegments(journey?.segments);
        (journey?.selections || []).forEach((selection) => {
            const passengerIndex = Number(selection.passenger_index ?? selection.passengerIndex ?? 0);
            const passengerName = getBookingPassengerName(detail, passengerIndex);
            const ctx = {
                passengerIndex,
                passengerName,
                routes: journeyRoutes,
                defaultCurrency,
            };

            const bags = selection.baggage || selection.bags || [];
            (Array.isArray(bags) ? bags : [bags]).forEach((bag) => {
                pushUnique(bagItems, parseBagItem(bag, ctx), (b) =>
                    `bag:${b.passengerIndex}:${b.ancillaryKey}:${b.label}:${b.routes.join('|')}`
                );
            });

            const seats = selection.seat || selection.seats || [];
            (Array.isArray(seats) ? seats : [seats]).forEach((seat) => {
                pushUnique(seatItems, parseSeatItem(seat, ctx), (s) =>
                    `seat:${s.passengerIndex}:${s.segmentKey}:${normalizeFlightLabel(s.flightLabel)}:${s.seatName}:${s.ancillaryKey}`
                );
            });
        });
    });
};

const collectFromPassengers = (detail, seatItems, bagItems, defaultCurrency) => {
    (detail?.passenger_details || []).forEach((passenger, index) => {
        const passengerIndex = Number(
            passenger.passenger_index ?? passenger.index ?? index
        );
        const passengerName = getBookingPassengerName(detail, passengerIndex);
        const ctx = { passengerIndex, passengerName, defaultCurrency };

        const seatSources = [
            passenger.seats,
            passenger.seat_selections,
            passenger.seat,
            passenger.ancillary?.seats,
            passenger.ancillary?.seat,
        ];
        seatSources.forEach((source) => {
            if (!source) return;
            const list = Array.isArray(source) ? source : [source];
            list.forEach((seat) => {
                pushUnique(seatItems, parseSeatItem(seat, ctx), (s) =>
                    `seat:${s.passengerIndex}:${s.segmentKey}:${normalizeFlightLabel(s.flightLabel)}:${s.seatName}:${s.ancillaryKey}`
                );
            });
        });

        const bagSources = [
            passenger.baggage,
            passenger.extra_baggage,
            passenger.ancillary?.baggage,
        ];
        bagSources.forEach((source) => {
            if (!source) return;
            const list = Array.isArray(source) ? source : [source];
            list.forEach((bag) => {
                pushUnique(bagItems, parseBagItem(bag, ctx), (b) =>
                    `bag:${b.passengerIndex}:${b.ancillaryKey}:${b.label}`
                );
            });
        });
    });
};

const collectFromTopLevelArrays = (detail, seatItems, bagItems, defaultCurrency) => {
    const assignPassenger = (item, fallbackIndex) => {
        const passengerIndex = Number(
            item.passenger_index ?? item.passengerIndex ?? fallbackIndex ?? 0
        );
        return {
            passengerIndex,
            passengerName: getBookingPassengerName(detail, passengerIndex),
            defaultCurrency,
            routes: Array.isArray(item.routes)
                ? item.routes
                : [item.route].filter(Boolean),
        };
    };

    (detail?.extra_baggage || []).forEach((bag, idx) => {
        pushUnique(bagItems, parseBagItem(bag, assignPassenger(bag, idx)), (b) =>
            `bag:${b.passengerIndex}:${b.ancillaryKey}:${b.label}`
        );
    });

    (detail?.seat_selections || []).forEach((seat, idx) => {
        pushUnique(seatItems, parseSeatItem(seat, assignPassenger(seat, idx)), (s) =>
            `seat:${s.passengerIndex}:${s.segmentKey}:${normalizeFlightLabel(s.flightLabel)}:${s.seatName}`
        );
    });

    (detail?.additional_services || []).forEach((service, idx) => {
        if (isBagLikeService(service)) {
            pushUnique(bagItems, parseBagItem(service, assignPassenger(service, idx)), (b) =>
                `bag:${b.passengerIndex}:${b.ancillaryKey}:${b.label}`
            );
        } else if (isSeatLikeService(service)) {
            pushUnique(seatItems, parseSeatItem(service, assignPassenger(service, idx)), (s) =>
                `seat:${s.passengerIndex}:${s.segmentKey}:${normalizeFlightLabel(s.flightLabel)}:${s.seatName}`
            );
        }
    });
};

const indexByPassenger = (items) => {
    const map = {};
    items.forEach((item) => {
        const idx = item.passengerIndex;
        if (!map[idx]) map[idx] = [];
        map[idx].push(item);
    });
    return map;
};

/**
 * Parse booked seats and extra baggage from flight booking details API payload.
 */
export function getFlightBookingAncillaries(detail) {
    const seatItems = [];
    const bagItems = [];
    const defaultCurrency =
        detail?.pricing?.display_currency || detail?.pricing?.currency || '';

    const journeySources = [
        detail?.ancillary?.journeys,
        detail?.ancillaries?.journeys,
        ...(Array.isArray(detail?.ancillaries)
            ? detail.ancillaries.flatMap((a) => a?.journeys || [])
            : []),
    ].filter((j) => Array.isArray(j) && j.length);

    journeySources.forEach((journeys) => {
        collectFromJourneys(journeys, detail, seatItems, bagItems, defaultCurrency);
    });

    collectFromPassengers(detail, seatItems, bagItems, defaultCurrency);
    collectFromTopLevelArrays(detail, seatItems, bagItems, defaultCurrency);
    collectFromPaidBaggageInfo(detail, seatItems, bagItems, defaultCurrency);
    enrichSeatsFromSegments(detail, seatItems);

    return {
        seatItems,
        bagItems,
        seatsByPassengerIndex: indexByPassenger(seatItems),
        bagsByPassengerIndex: indexByPassenger(bagItems),
        hasAncillaries: seatItems.length > 0 || bagItems.length > 0,
    };
}

export const seatItemMatchesSegment = (seatItem, segmentMeta) => {
    if (!seatItem || !segmentMeta) return false;

    if (
        seatItem.segmentKey &&
        segmentMeta.segmentKey &&
        seatItem.segmentKey === segmentMeta.segmentKey
    ) {
        return true;
    }

    if (
        seatItem.flightLabel &&
        segmentMeta.flightLabel &&
        normalizeFlightLabel(seatItem.flightLabel) ===
            normalizeFlightLabel(segmentMeta.flightLabel)
    ) {
        return true;
    }

    if (
        seatItem.departureCode &&
        seatItem.arrivalCode &&
        segmentMeta.departureCode &&
        segmentMeta.arrivalCode &&
        seatItem.departureCode === segmentMeta.departureCode &&
        seatItem.arrivalCode === segmentMeta.arrivalCode
    ) {
        return true;
    }

    return false;
};

export const getSeatsForBookingSegment = (detail, segment, segmentIndex, ancillaries) => {
    const meta = getBookingSegmentMeta(segment, segmentIndex);
    return (ancillaries?.seatItems || []).filter((item) => seatItemMatchesSegment(item, meta));
};

export const formatPassengerSeatSummary = (passengerIndex, ancillaries) => {
    const seats = ancillaries?.seatsByPassengerIndex?.[passengerIndex] || [];
    if (!seats.length) return '';

    return seats
        .map((seat) => {
            const flight = seat.flightLabel
                ? seat.flightLabel.replace(/\s+/g, '')
                : seat.route || 'Flight';
            return `${flight}: ${seat.seatName}`;
        })
        .join(', ');
};

/** Ticket numbers come as one "/"-joined string, one ticket per flight segment */
export const getPassengerTicketNumbers = (passenger) => {
    const raw =
        passenger?.ticketNum ||
        passenger?.ticket_number ||
        passenger?.checkIn?.ticketNum ||
        passenger?.checkIn?.ticket_num ||
        '';
    return String(raw)
        .split('/')
        .map((ticket) => ticket.trim())
        .filter(Boolean);
};

export const getPassengerTicketForSegment = (passenger, segmentIndex) => {
    const tickets = getPassengerTicketNumbers(passenger);
    if (!tickets.length) return '';
    if (tickets.length === 1) return tickets[0];
    return tickets[segmentIndex] || '';
};

/** One row per passenger for a flight segment: their e-ticket for that segment + seat (if any) */
export const getSegmentPassengerRows = (detail, segment, segmentIndex, ancillaries) => {
    const meta = getBookingSegmentMeta(segment, segmentIndex);
    return (detail?.passenger_details || [])
        .map((passenger, index) => {
            const passengerIndex = getPassengerIndexOf(passenger, index);
            const seat = (ancillaries?.seatsByPassengerIndex?.[passengerIndex] || []).find((item) =>
                seatItemMatchesSegment(item, meta)
            );
            return {
                passengerIndex,
                passengerName: getBookingPassengerName(detail, passengerIndex),
                passengerType: passenger?.type,
                ticketNumber: getPassengerTicketForSegment(passenger, segmentIndex),
                seatName: seat?.seatName || '',
                seatPosition: seat?.position || '',
            };
        })
        .filter((row) => row.ticketNumber || row.seatName);
};

/** Extra (paid) baggage rows for a passenger, with the flights each bag applies to */
export const getPassengerBaggageRows = (passengerIndex, ancillaries) =>
    (ancillaries?.bagsByPassengerIndex?.[passengerIndex] || []).map((bag) => ({
        label: bag.label,
        flights: (bag.flightLabels || []).map((label) => label.replace(/\s+/g, '')),
        routes: bag.routes || [],
        price: bag.price,
        hasPrice: bag.hasPrice,
        currency: bag.currency,
    }));

/** Totals from baggage_info.paid (useful for the invoice) */
export const getPaidAncillaryTotals = (detail) => {
    const paid = detail?.baggage_info?.paid;
    if (!paid || typeof paid !== 'object') return null;
    const baggage = Number(paid.baggage_amount || 0);
    const seat = Number(paid.seat_amount || 0);
    const total = Number(paid.total_amount ?? baggage + seat);
    if (!baggage && !seat && !total) return null;
    return { currency: paid.currency || '', baggage, seat, total };
};

export const sumAncillaryPrices = (ancillaries) => {
    const items = [
        ...(ancillaries?.seatItems || []),
        ...(ancillaries?.bagItems || []),
    ];
    const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const currency =
        items.find((item) => item.currency)?.currency ||
        ancillaries?.seatItems?.[0]?.currency ||
        ancillaries?.bagItems?.[0]?.currency ||
        '';
    return { total: Number(total.toFixed(2)), currency };
};

export const pricingIncludesAncillaryLine = (pricing) => {
    if (!pricing || typeof pricing !== 'object') return false;
    const keys = [
        'ancillary_amount',
        'ancillaries_amount',
        'extra_services_amount',
        'seat_amount',
        'baggage_amount',
        'addons_amount',
    ];
    return keys.some((key) => Number(pricing[key]) > 0);
};