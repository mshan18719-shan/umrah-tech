export const FLIGHT_TIME_SLOTS = [
    { id: 0, label: '00:00 - 06:00', start: 0, end: 6 },
    { id: 1, label: '06:00 - 12:00', start: 6, end: 12 },
    { id: 2, label: '12:00 - 18:00', start: 12, end: 18 },
    { id: 3, label: '18:00 - 24:00', start: 18, end: 24 },
];

export const getSlotForHour = (hour) => {
    if (hour >= 0 && hour < 6) return 0;
    if (hour >= 6 && hour < 12) return 1;
    if (hour >= 12 && hour < 18) return 2;
    return 3;
};

export const getOutboundLegTimes = (flight, getFlightLegs) => {
    const legs = getFlightLegs(flight);
    const outbound = legs[0];
    if (!outbound?.segments?.length) return null;

    const firstSegment = outbound.segments[0];
    const lastSegment = outbound.segments[outbound.segments.length - 1];

    return {
        departureHour: new Date(firstSegment.departure.datetime).getHours(),
        arrivalHour: new Date(lastSegment.arrival.datetime).getHours(),
        departureCity: firstSegment.departure.city,
        departureCode: firstSegment.departure.airport_code,
        arrivalCity: lastSegment.arrival.city,
        arrivalCode: lastSegment.arrival.airport_code,
    };
};
