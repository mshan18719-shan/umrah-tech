"use client";
import { useEffect } from "react";
import moment from "moment";
import { createContext, useContext, useState, useMemo } from "react";
const FlightContext = createContext();
import { useCurrency } from "@/util/currency";
import { getOutboundLegTimes, getSlotForHour } from "./Filters/flightTimeSlots";
import { groupSegments } from "./Checkout/flightHelpers";

// Helper function to calculate total duration including layovers for a set of segments
const calculateTotalDuration = (segments) => {
    if (!segments || segments.length === 0) return 0;
    // const firstSegment = segments[0];
    // const lastSegment = segments[segments.length - 1];
    // const departureTime = new Date(firstSegment.departure.datetime);
    // const arrivalTime = new Date(lastSegment.arrival.datetime);
    const totalTime = segments.reduce((acc, seg, idx) => {
        let time = acc + seg.duration;
        const nextSeg = segments[idx + 1];
        if (nextSeg) {
            time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
        }
        return time;
    }, 0);
    return totalTime;
};

// Helper function to group flight segments into legs based on trip type
const getFlightLegs = (flight) => {
    return groupSegments(flight).map((group) => ({ segments: group.segments }));
};

// Helper function to get maximum leg duration for a flight (including layovers)
const getMaxLegDuration = (flight) => {
    const legs = getFlightLegs(flight);
    if (legs.length === 0) return 0;
    return Math.max(...legs.map(leg => calculateTotalDuration(leg.segments)));
};

// Helper function to calculate total layover time for a set of segments
const calculateLayoverTime = (segments) => {
    if (!segments || segments.length <= 1) return 0;

    let totalLayover = 0;
    for (let i = 0; i < segments.length - 1; i++) {
        const arrivalTime = new Date(segments[i].arrival.datetime);
        const nextDepartureTime = new Date(segments[i + 1].departure.datetime);
        const layover = Math.round((nextDepartureTime - arrivalTime) / (1000 * 60)); // in minutes
        totalLayover += layover;
    }
    return totalLayover;
};

// Helper function to get maximum layover time for a flight
const getMaxLayoverTime = (flight) => {
    const legs = getFlightLegs(flight);
    if (legs.length === 0) return 0;
    return Math.max(...legs.map(leg => calculateLayoverTime(leg.segments)));
};
export function FlightProvider({ children, flights, infiniteScroll = false }) {
    const [convertedFlights, setConvertedFlights] = useState([]);
    const { currency, rates } = useCurrency();

    // Filter states
    const [selectedAirlines, setSelectedAirlines] = useState([]);
    const [selectedStops, setSelectedStops] = useState([]);
    const [selectedCabinClass, setSelectedCabinClass] = useState([]);
    const [durationRange, setDurationRange] = useState([0, 1440]); // in minutes
    const [layoverRange, setLayoverRange] = useState([0, 1440]); // in minutes
    const [selectedDepartureSlots, setSelectedDepartureSlots] = useState([]);
    const [selectedArrivalSlots, setSelectedArrivalSlots] = useState([]);
    const [sort, setSort] = useState("recommended");
    const [minDuration, setMinDuration] = useState(0);
    const [maxDuration, setMaxDuration] = useState(1440);
    const [minLayover, setMinLayover] = useState(0);
    const [maxLayover, setMaxLayover] = useState(1440);
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleCount, setVisibleCount] = useState(10);
    const itemsPerPage = 10;
    useEffect(() => {
        if (flights && flights.length > 0) {
            // Calculate duration ranges including layovers
            const durations = flights.map(flight => getMaxLegDuration(flight));
            const minDur = Math.min(...durations);
            const maxDur = Math.max(...durations);
            setMinDuration(minDur);
            setMaxDuration(maxDur);
            setDurationRange([minDur, maxDur]);

            // Calculate layover time ranges
            const layovers = flights.map(flight => getMaxLayoverTime(flight));
            const minLay = Math.min(...layovers);
            const maxLay = Math.max(...layovers);
            setMinLayover(minLay);
            setMaxLayover(maxLay);
            setLayoverRange([minLay, maxLay]);

            setSelectedDepartureSlots([]);
            setSelectedArrivalSlots([]);
            setConvertedFlights(flights);
        } else {
            setConvertedFlights([]);
        }
    }, [flights, rates, currency]);

    const resetFilters = () => {
        setSelectedAirlines([]);
        setSelectedStops([]);
        setSelectedCabinClass([]);
        setSort("recommended");
        setDurationRange([minDuration, maxDuration]);
        setLayoverRange([minLayover, maxLayover]);
        setSelectedDepartureSlots([]);
        setSelectedArrivalSlots([]);
        setCurrentPage(1);
        setVisibleCount(10);
    };


    const filteredFlights = useMemo(() => {
        let result = [...convertedFlights];

        // Filter by Airlines
        if (selectedAirlines.length > 0) {
            result = result.filter((flight) =>
                flight.segments?.some((segment) =>
                    selectedAirlines.includes(segment.airline?.code)
                )
            );
        }

        // Filter by Stops
        if (selectedStops.length > 0) {
            result = result.filter((flight) => {
                if (!flight.segments) return false;

                // Group segments into legs based on trip type
                const legs = getFlightLegs(flight);

                // Check if all legs match the selected stops criteria
                return legs.every(leg => {
                    const stops = leg.segments.length - 1;
                    return selectedStops.includes(stops);
                });
            });
        }

        // Filter by Cabin Class
        if (selectedCabinClass.length > 0) {
            result = result.filter((flight) =>
                flight.segments?.some((segment) =>
                    selectedCabinClass.includes(segment.cabin_class?.name)
                )
            );
        }

        // Filter by Journey Duration (including layovers)
        result = result.filter((flight) => {
            const totalDuration = getMaxLegDuration(flight);
            return totalDuration >= durationRange[0] && totalDuration <= durationRange[1];
        });

        // Filter by Layover Time
        result = result.filter((flight) => {
            const totalLayover = getMaxLayoverTime(flight);
            return totalLayover >= layoverRange[0] && totalLayover <= layoverRange[1];
        });

        // Filter by Flight Times (departure & arrival slots)
        if (selectedDepartureSlots.length > 0) {
            result = result.filter((flight) => {
                const legTimes = getOutboundLegTimes(flight, getFlightLegs);
                if (!legTimes) return false;
                return selectedDepartureSlots.includes(getSlotForHour(legTimes.departureHour));
            });
        }

        if (selectedArrivalSlots.length > 0) {
            result = result.filter((flight) => {
                const legTimes = getOutboundLegTimes(flight, getFlightLegs);
                if (!legTimes) return false;
                return selectedArrivalSlots.includes(getSlotForHour(legTimes.arrivalHour));
            });
        }

        // Sort
        if (sort === "price-asc") {
            result.sort((a, b) => parseFloat(a.pricing?.total_amount || 0) - parseFloat(b.pricing?.total_amount || 0));
        } else if (sort === "price-desc") {
            result.sort((a, b) => parseFloat(b.pricing?.total_amount || 0) - parseFloat(a.pricing?.total_amount || 0));
        } else if (sort === "duration-asc") {
            result.sort((a, b) => {
                const aDuration = getMaxLegDuration(a);
                const bDuration = getMaxLegDuration(b);
                return aDuration - bDuration;
            });
        }

        return result;
    }, [convertedFlights, selectedAirlines, selectedStops, selectedCabinClass, durationRange, layoverRange, selectedDepartureSlots, selectedArrivalSlots, sort]);

    const totalPages = Math.ceil(filteredFlights.length / itemsPerPage);
    const paginatedFlights = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredFlights.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredFlights, currentPage]);

    const visibleFlights = useMemo(() => {
        return filteredFlights.slice(0, visibleCount);
    }, [filteredFlights, visibleCount]);

    const hasMore = infiniteScroll && visibleCount < filteredFlights.length;

    const loadMore = () => {
        if (!infiniteScroll) return;
        setVisibleCount(prev => Math.min(prev + itemsPerPage, filteredFlights.length));
    };

    const handleSetCurrentPage = (pageOrFn) => {
        setCurrentPage(prev => {
            const next = typeof pageOrFn === 'function' ? pageOrFn(prev) : pageOrFn;
            if (infiniteScroll) {
                setVisibleCount(next * itemsPerPage);
            }
            return next;
        });
    };

    useEffect(() => {
        if (!infiniteScroll) return;
        setVisibleCount(10);
        setCurrentPage(1);
    }, [
        infiniteScroll,
        selectedAirlines,
        selectedStops,
        selectedCabinClass,
        durationRange,
        layoverRange,
        selectedDepartureSlots,
        selectedArrivalSlots,
        sort,
        convertedFlights.length,
    ]);
    // Get unique airlines with counts
    const airlinesWithCounts = useMemo(() => {
        const airlineCounts = {};
        convertedFlights.forEach((flight) => {
            // Get unique airlines in this flight
            const uniqueAirlines = new Set();
            flight.segments?.forEach((segment) => {
                const code = segment.airline?.code || segment.operating_airline?.code;
                const name = segment.operating_airline?.name || segment.airline?.name;
                if (code) {
                    uniqueAirlines.add(JSON.stringify({ code, name }));
                }
            });
            // Increment count for each unique airline in this flight
            uniqueAirlines.forEach(airlineStr => {
                const airline = JSON.parse(airlineStr);
                if (!airlineCounts[airline.code]) {
                    airlineCounts[airline.code] = { name: airline.name, count: 0 };
                }
                airlineCounts[airline.code].count++;
            });
        });
        return Object.entries(airlineCounts).map(([code, data]) => ({
            code,
            name: data.name || code,
            count: data.count
        }));
    }, [convertedFlights]);

    // Get stops with counts
    const stopsWithCounts = useMemo(() => {
        const stopCounts = { 0: 0, 1: 0, 2: 0 };
        convertedFlights.forEach((flight) => {
            if (!flight.segments) return;

            // Group segments into legs and count stops per leg
            const legs = getFlightLegs(flight);
            const maxStops = Math.max(...legs.map(leg => leg.segments.length - 1));

            if (maxStops >= 2) stopCounts[2]++;
            else stopCounts[maxStops]++;
        });
        return stopCounts;
    }, [convertedFlights]);

    const flightTimeSlotData = useMemo(() => {
        const departure = {};
        const arrival = {};
        let currency = 'GBP';

        convertedFlights.forEach((flight) => {
            const legTimes = getOutboundLegTimes(flight, getFlightLegs);
            if (!legTimes) return;

            currency = flight.pricing?.currency || currency;
            const price = parseFloat(flight.pricing?.total_amount || 0);
            const depSlot = getSlotForHour(legTimes.departureHour);
            const arrSlot = getSlotForHour(legTimes.arrivalHour);

            [depSlot, arrSlot].forEach((slotId, index) => {
                const bucket = index === 0 ? departure : arrival;
                if (!bucket[slotId]) {
                    bucket[slotId] = { minPrice: price, count: 1 };
                } else {
                    bucket[slotId].count += 1;
                    bucket[slotId].minPrice = Math.min(bucket[slotId].minPrice, price);
                }
            });
        });

        return { departure, arrival, currency };
    }, [convertedFlights]);

    const flightTimeRoute = useMemo(() => {
        const firstFlight = convertedFlights[0];
        if (!firstFlight) return null;
        return getOutboundLegTimes(firstFlight, getFlightLegs);
    }, [convertedFlights]);

    // Get cabin classes with counts
    const cabinClassesWithCounts = useMemo(() => {
        const classCounts = {};
        convertedFlights.forEach((flight) => {
            flight.segments?.forEach((segment) => {
                const cabinClass = segment.cabin_class?.name;
                if (cabinClass) {
                    classCounts[cabinClass] = (classCounts[cabinClass] || 0) + 1;
                }
            });
        });
        return Object.entries(classCounts).map(([name, count]) => ({ name, count }));
    }, [convertedFlights]);
    return (
        <FlightContext.Provider
            value={{
                flights: infiniteScroll ? visibleFlights : paginatedFlights,
                totalFlights: filteredFlights.length,
                allFlights: convertedFlights,
                totalPages,
                currentPage,
                setCurrentPage: handleSetCurrentPage,
                hasMore,
                loadMore,
                itemsPerPage,
                // Filter states
                selectedAirlines,
                setSelectedAirlines,
                selectedStops,
                setSelectedStops,
                selectedCabinClass,
                setSelectedCabinClass,
                durationRange,
                setDurationRange,
                layoverRange,
                setLayoverRange,
                selectedDepartureSlots,
                setSelectedDepartureSlots,
                selectedArrivalSlots,
                setSelectedArrivalSlots,
                sort,
                setSort,
                minDuration,
                maxDuration,
                minLayover,
                maxLayover,
                // Data for filters
                airlinesWithCounts,
                stopsWithCounts,
                cabinClassesWithCounts,
                flightTimeSlotData,
                flightTimeRoute,
                resetFilters,
            }}
        >
            {children}
        </FlightContext.Provider>
    );
}

export function useFlightList() {
    return useContext(FlightContext);
}
