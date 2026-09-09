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

export const groupSegments = (flight) => {
    if (!flight?.segments?.length) return [];

    if (flight.trip_type === 'return') {
        const legs = flight?.search_criteria?.legs || [];
        if (legs.length === 0) {
            const midpoint = Math.ceil(flight.segments.length / 2);
            return [
                { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
                { segments: flight.segments.slice(midpoint), label: 'Return' },
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
    }

    if (flight.trip_type === 'multicity') {
        const legs = flight.search_criteria?.legs || [];
        if (legs.length === 0) {
            return flight.segments.map((segment, idx) => ({
                segments: [segment],
                label: `Flight ${idx + 1}`,
            }));
        }

        const groupedLegs = [];
        let currentSegmentIndex = 0;

        legs.forEach((leg, legIndex) => {
            const legSegments = [];
            while (currentSegmentIndex < flight.segments.length) {
                const segment = flight.segments[currentSegmentIndex];
                legSegments.push(segment);
                currentSegmentIndex++;
                if (segment.arrival.airport_code === leg.destination) break;
            }
            if (legSegments.length) {
                groupedLegs.push({
                    segments: legSegments,
                    label: `Flight ${legIndex + 1}`,
                });
            }
        });

        return groupedLegs;
    }

    return [{ segments: flight.segments, label: 'Departure' }];
};

export const getPassengerCount = (flight) => {
    if (!flight?.passenger_pricing?.length) return 0;
    return flight.passenger_pricing.length;
};

export const getPassengerLabel = (flight) => {
    if (!flight?.passenger_pricing?.length) return '';

    let adults = 0;
    let children = 0;
    let infants = 0;

    flight.passenger_pricing.forEach((pp) => {
        if (pp.passenger_type === 'adult') adults++;
        else if (pp.passenger_type === 'child') children++;
        else if (pp.passenger_type === 'infant') infants++;
    });

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

export const isNonRefundable = (flight) => {
    // if (flight?.refundable === false) return true;
    if (flight?.penalties?.refund_before_departure?.allowed === true) return true;
    return false;
};

export const getPassengerPricingRows = (flight, selectedCurrency, rates = {}) => {
    const pricing = flight?.pricing;
    const originalCurrency = pricing?.currency;
    const cabinClass = flight?.segments?.[0]?.cabin_class?.name || '';

    const buildRow = (type, count, unitPrice, totalPrice) => {
        const convertedUnit = formatConvertedPrice(unitPrice, originalCurrency, selectedCurrency, rates);

        return {
            key: type,
            label: `${count} ${type.charAt(0).toUpperCase() + type.slice(1)}${count > 1 ? 's' : ''}, ${cabinClass}`,
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

    const searchCriteria = flight?.search_criteria;
    const rows = [];
    const baseAmount =
        Number(pricing?.base_amount || 0) + Number(pricing?.markup_details?.total_markup_amount || 0);
    const passengerCount = getPassengerCount(flight) || 1;

    const addRow = (count, type) => {
        if (!count) return;
        const unitPrice = baseAmount / passengerCount;
        rows.push(buildRow(type, count, unitPrice, unitPrice * count));
    };

    if (searchCriteria) {
        addRow(searchCriteria.adults || 0, 'adult');
        addRow(searchCriteria.children || 0, 'child');
        addRow(searchCriteria.infants || 0, 'infant');
    }

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
