import moment from 'moment';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';

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

/** Normalize API trip type variants: multicity | multi_city | MultiCity → multicity */
export const normalizeTripType = (flight) => {
    const raw = (
        flight?.trip_type ||
        flight?.search_criteria?.AirTripType ||
        flight?.search_criteria?.air_trip_type ||
        ''
    )
        .toString()
        .toLowerCase()
        .replace(/[_\s-]/g, '');

    if (raw === 'multicity') return 'multicity';
    if (raw === 'return' || raw === 'roundtrip') return 'return';
    if (raw === 'oneway') return 'oneway';

    const legs = flight?.search_criteria?.legs;
    if (Array.isArray(legs) && legs.length > 2) return 'multicity';
    if (Array.isArray(legs) && legs.length === 2) {
        const airType = (flight?.search_criteria?.AirTripType || '').toString().toLowerCase();
        if (airType === 'multicity' || airType === 'multi_city') return 'multicity';
        return 'return';
    }
    return 'oneway';
};

const getLegOrigin = (leg) =>
    (leg?.origin || leg?.from || leg?.departure || '').toString().toUpperCase();

const getLegDestination = (leg) =>
    (leg?.destination || leg?.to || leg?.arrival || '').toString().toUpperCase();

const getAirportCode = (value) => (value || '').toString().toUpperCase();

const groupBySearchLegs = (segments, legs, labels) => {
    const groupedLegs = [];
    let segmentIndex = 0;

    legs.forEach((leg, legIndex) => {
        const legSegments = [];
        const destination = getLegDestination(leg);
        const nextOrigin = getLegOrigin(legs[legIndex + 1]);

        while (segmentIndex < segments.length) {
            const segment = segments[segmentIndex];
            legSegments.push(segment);
            segmentIndex++;

            const arrivalCode = getAirportCode(segment?.arrival?.airport_code);
            if (destination && arrivalCode === destination) break;

            // If destination code never matches, end leg when next leg's origin starts
            if (
                nextOrigin &&
                segmentIndex < segments.length &&
                getAirportCode(segments[segmentIndex]?.departure?.airport_code) === nextOrigin
            ) {
                break;
            }
        }

        if (legSegments.length) {
            groupedLegs.push({
                segments: legSegments,
                label: labels?.[legIndex] || `Flight ${legIndex + 1}`,
            });
        }
    });

    // Append any leftover segments to the last group
    if (segmentIndex < segments.length && groupedLegs.length) {
        groupedLegs[groupedLegs.length - 1].segments.push(
            ...segments.slice(segmentIndex)
        );
    }

    return groupedLegs;
};

export const groupSegments = (flight) => {
    if (!flight?.segments?.length) return [];

    const tripType = normalizeTripType(flight);
    const legs = flight?.search_criteria?.legs || [];

    if (tripType === 'return') {
        if (legs.length === 0) {
            const midpoint = Math.ceil(flight.segments.length / 2);
            return [
                { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
                { segments: flight.segments.slice(midpoint), label: 'Return' },
            ];
        }
        return groupBySearchLegs(flight.segments, legs, ['Departure', 'Return']);
    }

    if (tripType === 'multicity') {
        if (legs.length === 0) {
            return flight.segments.map((segment, idx) => ({
                segments: [segment],
                label: `Flight ${idx + 1}`,
            }));
        }
        return groupBySearchLegs(
            flight.segments,
            legs,
            legs.map((_, idx) => `Flight ${idx + 1}`)
        );
    }

    return [{ segments: flight.segments, label: 'Departure' }];
};

export const getPassengerCount = (flight) => {
    const { adult, child, infant } = getFlightPassengerCounts(flight);
    return adult + child + infant;
};

const formatPassengerTypeLabel = (type, count) => {
    const key = (type || 'adult').toLowerCase();
    if (key === 'child' || key === 'children') return count === 1 ? 'Child' : 'Children';
    if (key === 'infant' || key === 'infants') return count === 1 ? 'Infant' : 'Infants';
    if (key === 'passenger' || key === 'passengers') return count === 1 ? 'Passenger' : 'Passengers';
    return count === 1 ? 'Adult' : 'Adults';
};

const formatPassengerBreakdownLabel = (counts) => {
    const parts = [];
    if (counts.adult > 0) parts.push(`${counts.adult} ${formatPassengerTypeLabel('adult', counts.adult)}`);
    if (counts.child > 0) parts.push(`${counts.child} ${formatPassengerTypeLabel('child', counts.child)}`);
    if (counts.infant > 0) parts.push(`${counts.infant} ${formatPassengerTypeLabel('infant', counts.infant)}`);
    if (!parts.length) {
        const total = Number(counts.adult || 0) + Number(counts.child || 0) + Number(counts.infant || 0);
        return `${total || 1} ${formatPassengerTypeLabel('passenger', total || 1)}`;
    }
    return parts.join(', ');
};

export const getPassengerLabel = (flight) => {
    return formatPassengerBreakdownLabel(getFlightPassengerCounts(flight));
};

export const getCompactPassengerLabel = (flight) => {
    const count = getPassengerCount(flight);
    if (!count) return '';
    return `${count} ${count === 1 ? 'passenger' : 'passengers'}`;
};

export const isNonRefundable = (flight) => {
    // if (flight?.refundable === false) return true;
    if (flight?.penalties?.refund_before_departure?.allowed === true) return true;
    return false;
};

export const getPassengerPricingRows = (flight, selectedCurrency, rates = {}) => {
    const pricing = flight?.pricing;
    const originalCurrency = pricing?.currency;
    const counts = getFlightPassengerCounts(flight);
    const totalPax = counts.adult + counts.child + counts.infant;
    const baseAmount =
        Number(pricing?.base_amount || 0) + Number(pricing?.markup_details?.total_markup_amount || 0);

    const buildRow = (type, count, unitPrice, totalPrice) => {
        const convertedUnit = formatConvertedPrice(unitPrice, originalCurrency, selectedCurrency, rates);

        return {
            key: type,
            label: `${count} ${formatPassengerTypeLabel(type, count)}`,
            quantityLabel: `${count} × ${convertedUnit.label}`,
            amount: totalPrice,
            currency: originalCurrency,
        };
    };

    if (flight?.passenger_pricing?.length) {
        const grouped = {};

        flight.passenger_pricing.forEach((pp) => {
            const type = (pp.passenger_type || 'adult').toLowerCase();
            const quantity = Number(pp.quantity) || 1;
            if (!grouped[type]) {
                grouped[type] = { count: 0, unitPrice: 0, totalPrice: 0 };
            }
            const lineAmount = Number(pp.base_amount || pp.amount || pp.price || 0);
            grouped[type].count += quantity;
            grouped[type].unitPrice = quantity > 0 ? lineAmount / quantity : lineAmount;
            grouped[type].totalPrice += lineAmount;
        });

        const pricingTypes = Object.keys(grouped);
        const onlyAdultsInPricing = pricingTypes.length === 1 && pricingTypes[0] === 'adult';
        const hasMixedPassengers = counts.child > 0 || counts.infant > 0;

        // API often lumps all pax as adult — prefer search mix for the label
        if (onlyAdultsInPricing && hasMixedPassengers) {
            const totalPrice = grouped.adult.totalPrice || baseAmount;
            return [{
                key: 'passengers',
                label: formatPassengerBreakdownLabel(counts),
                quantityLabel: `${totalPax} passengers`,
                amount: totalPrice,
                currency: originalCurrency,
            }];
        }

        return pricingTypes.map((type) =>
            buildRow(type, grouped[type].count, grouped[type].unitPrice, grouped[type].totalPrice)
        );
    }

    const rows = [];
    const safeTotal = totalPax || 1;

    const addRow = (count, type) => {
        if (!count) return;
        const unitPrice = baseAmount / safeTotal;
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

    return 'Permitted';
};

const PASSENGER_POLICY_KEYS = ['adult', 'child', 'infant'];

export const matchesSegmentIndexList = (segmentIndexList, segmentIndexes) => {
    if (!Array.isArray(segmentIndexList) || !segmentIndexList.length) return true;
    const zeroBased = new Set(segmentIndexes);
    const oneBased = new Set(segmentIndexes.map((idx) => idx + 1));
    return segmentIndexList.some((idx) => zeroBased.has(idx) || oneBased.has(idx));
};

export const pickPassengerPolicyEntry = (entries, segmentIndexes = [], legIndex = 0) => {
    if (!entries) return null;
    if (!Array.isArray(entries)) return entries;
    if (!entries.length) return null;

    const matched = entries.find((entry) =>
        Array.isArray(entry?.segment_index_list)
        && entry.segment_index_list.length
        && matchesSegmentIndexList(entry.segment_index_list, segmentIndexes)
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

export const getSegmentIndexesForGroup = (flight, segments = []) => {
    const allSegments = flight?.segments || [];
    return segments
        .map((seg) => allSegments.indexOf(seg))
        .filter((idx) => idx >= 0);
};

export const hasPassengerPenalties = (penalties) => {
    if (!penalties || typeof penalties !== 'object') return false;
    return PASSENGER_POLICY_KEYS.some((key) => {
        const value = penalties[key];
        if (Array.isArray(value)) return value.length > 0;
        return !!(value && typeof value === 'object' && (
            value.refund_before_departure
            || value.refund_after_departure
            || value.change_before_departure
            || value.change_after_departure
        ));
    });
};

/** Normalize baggage entry whether object or array-of-objects */
export const normalizeBaggageEntry = (raw) => {
    if (!raw) return null;
    if (Array.isArray(raw)) {
        const item = raw.find((b) => b?.cabin || b?.checked) || raw[0];
        return item || null;
    }
    if (typeof raw === 'object') return raw;
    return null;
};

/** Collect unique cabin/checked rows for a leg (adult / child / infant) */
export const getLegBaggageRows = (flight, segments = [], legIndex = 0) => {
    const segmentIndexes = getSegmentIndexesForGroup(flight, segments);
    const rows = [];
    const seen = new Set();

    const sources = [];
    segments.forEach((seg) => {
        if (seg?.baggage_info) sources.push(seg.baggage_info);
    });
    if (!sources.length && flight?.baggage_info) sources.push(flight.baggage_info);

    sources.forEach((baggageInfo) => {
        PASSENGER_POLICY_KEYS.forEach((type) => {
            const entry = pickPassengerPolicyEntry(baggageInfo[type], segmentIndexes, legIndex)
                || normalizeBaggageEntry(baggageInfo[type]);
            if (!entry) return;

            if (entry.cabin) {
                const key = `${type}-cabin-${entry.cabin}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    rows.push({
                        key,
                        service: 'Cabin Baggage',
                        passenger: type,
                        detail: entry.cabin,
                    });
                }
            }
            if (entry.checked) {
                const key = `${type}-checked-${entry.checked}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    rows.push({
                        key,
                        service: 'Checked Baggage',
                        passenger: type,
                        detail: entry.checked,
                    });
                }
            }
        });
    });

    return rows;
};

/**
 * Per-passenger policy rows for a leg.
 * kind: 'change' → change_before/after; 'refund' → refund_before/after
 */
export const getLegPassengerPolicyRows = (flight, segments = [], legIndex = 0, kind = 'refund') => {
    const penalties = flight?.penalties;
    if (!penalties) return [];

    const beforeKey = kind === 'change' ? 'change_before_departure' : 'refund_before_departure';
    const afterKey = kind === 'change' ? 'change_after_departure' : 'refund_after_departure';
    const segmentIndexes = getSegmentIndexesForGroup(flight, segments);
    const counts = getFlightPassengerCounts(flight);

    const rows = [];

    if (hasPassengerPenalties(penalties)) {
        PASSENGER_POLICY_KEYS.forEach((type) => {
            if (type === 'child' && !counts.child && !penalties[type]) return;
            if (type === 'infant' && !counts.infant && !penalties[type]) return;

            const entry = pickPassengerPolicyEntry(penalties[type], segmentIndexes, legIndex);
            if (!entry) return;
            if (!entry[beforeKey] && !entry[afterKey]) return;

            rows.push({
                key: type,
                passenger: type,
                before: entry[beforeKey] || null,
                after: entry[afterKey] || null,
            });
        });
        return rows;
    }

    // Legacy flat penalties — show for adult (and other types if searched)
    const before = penalties[beforeKey] || null;
    const after = penalties[afterKey] || null;
    if (!before && !after) return [];

    PASSENGER_POLICY_KEYS.forEach((type) => {
        if (type === 'adult' && counts.adult > 0) {
            rows.push({ key: type, passenger: type, before, after });
        } else if (type === 'child' && counts.child > 0) {
            rows.push({ key: type, passenger: type, before, after });
        } else if (type === 'infant' && counts.infant > 0) {
            rows.push({ key: type, passenger: type, before, after });
        }
    });

    if (!rows.length) {
        rows.push({ key: 'adult', passenger: 'adult', before, after });
    }

    return rows;
};

/** Format change/refund policy for policy table cells */
export const formatPolicyFeeLabel = (penalty, kind, selectedCurrency, rates = {}) => {
    if (!penalty) return '—';

    const allowed = penalty.allowed === true
        || penalty.allowed === 'true'
        || penalty.allowed === 1
        || penalty.allowed === '1';

    if (!allowed) {
        return kind === 'refund' ? 'Not refundable' : 'Not permitted';
    }

    const amount = Number(penalty.penalty_amount);
    if (penalty.penalty_amount != null && penalty.penalty_currency && !Number.isNaN(amount) && amount > 0) {
        return formatConvertedPrice(
            penalty.penalty_amount,
            penalty.penalty_currency,
            selectedCurrency,
            rates
        ).label;
    }

    return 'Free';
};

/** Passenger counts for revalidate / checkout (search params or flight data). */
export const getFlightPassengerCounts = (flight, overrides = {}) => {
    const fromPricing = () => {
        if (!flight?.passenger_pricing?.length) return null;
        let adult = 0;
        let child = 0;
        let infant = 0;
        flight.passenger_pricing.forEach((pp) => {
            const qty = Number(pp.quantity || 1);
            const type = (pp.passenger_type || '').toLowerCase();
            if (type === 'adult') adult += qty;
            else if (type === 'child') child += qty;
            else if (type === 'infant') infant += qty;
        });
        if (!adult && !child && !infant) return null;
        return { adult: adult || 1, child, infant };
    };

    const criteria = flight?.search_criteria || {};
    const priced = fromPricing();
    const adult =
        Number(
            overrides.adult
            ?? criteria.adult
            ?? criteria.adults
            ?? priced?.adult
            ?? 1
        ) || 1;
    const child =
        Number(
            overrides.child
            ?? criteria.child
            ?? criteria.children
            ?? priced?.child
            ?? 0
        ) || 0;
    const infant =
        Number(
            overrides.infant
            ?? overrides.infants
            ?? criteria.infant
            ?? criteria.infants
            ?? priced?.infant
            ?? 0
        ) || 0;

    return { adult, child, infant };
};

/** Build POST body for /api/flights/revalidate */
export const buildRevalidatePayload = (flight, countOverrides = {}) => {
    const { adult, child, infant } = getFlightPassengerCounts(flight, countOverrides);
    const rawTag = flight?.tag ?? flight?.fare_tag ?? flight?.fare?.tag ?? null;

    return {
        provider: flight?.provider,
        id: flight?.id,
        tag: rawTag == null || rawTag === '' ? '' : String(rawTag),
        adult,
        child,
        infants: infant,
        segments: flight?.segments || [],
    };
};

/** Normalize revalidate API response into a checkout-ready flight object */
export const normalizeRevalidateResponse = (response, originalFlight, payload) => {
    const data = response?.data;
    let flight = null;

    if (data?.flight?.segments) flight = data.flight;
    else if (Array.isArray(data?.flights) && data.flights[0]?.segments) flight = data.flights[0];
    else if (data?.segments) flight = data;

    if (!flight?.segments?.length) return null;

    const adult = payload?.adult ?? flight?.search_criteria?.adult ?? originalFlight?.search_criteria?.adult ?? 1;
    const child = payload?.child ?? flight?.search_criteria?.child ?? originalFlight?.search_criteria?.child ?? 0;
    const infant = payload?.infants
        ?? payload?.infant
        ?? flight?.search_criteria?.infant
        ?? originalFlight?.search_criteria?.infant
        ?? 0;

    return {
        ...originalFlight,
        ...flight,
        provider: flight.provider || originalFlight?.provider || payload?.provider,
        id: flight.id || originalFlight?.id || payload?.id,
        tag: flight.tag ?? payload?.tag ?? originalFlight?.tag ?? '',
        trip_type: flight.trip_type || originalFlight?.trip_type,
        search_criteria: {
            ...(originalFlight?.search_criteria || {}),
            ...(flight.search_criteria || {}),
            adult: Number(adult) || 1,
            child: Number(child) || 0,
            infant: Number(infant) || 0,
        },
    };
};
