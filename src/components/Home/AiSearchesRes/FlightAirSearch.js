'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import moment from 'moment'

export default function FlightAiSearch({ searchResponse }) {
    const router = useRouter()

    useEffect(() => {
        if (searchResponse) {
            navigateToFlights()
        }
    }, [searchResponse])

    const navigateToFlights = () => {
        // MultiCity
        if (searchResponse.legs && searchResponse.legs.length > 1 && searchResponse?.AirTripType === "MultiCity") {
            const params = new URLSearchParams({
                adult: searchResponse.adult,
                child: searchResponse.child,
                infant: searchResponse.infant,
                CabinType: searchResponse.CabinType,
                AirTripType: searchResponse.AirTripType,
            });
            searchResponse.legs.forEach((flight, index) => {
                params.append(`flight${index + 1}_from`, flight.origin);
                params.append(`flight${index + 1}_to`, flight.destination);
                params.append(`flight${index + 1}_date`, moment(flight.departure_date).format("YYYY-MM-DD"));
            });

            router.push(`/flights?${params.toString()}`);
        } else {
            if (searchResponse.legs && searchResponse.legs.length > 0) {
                var leg = searchResponse.legs[0];
                if (searchResponse?.AirTripType === 'Return') {
                    var returndata = searchResponse.legs[1];
                }
            }
            const params = new URLSearchParams({
                DepartureCode: leg.origin,
                ArrivalCode: leg.destination,
                DepartureDate: moment(leg.departure_date).format("YYYY-MM-DD"),
                ReturnDate: searchResponse?.AirTripType === "Return" && returndata.departure_date ? moment(returndata.departure_date).format("YYYY-MM-DD") : '',
                adult: searchResponse.adult,
                child: searchResponse.child,
                infant: searchResponse.infant,
                CabinType: searchResponse.CabinType,
                AirTripType: searchResponse.AirTripType,
            });
            router.push(`/flights?${params.toString()}`);
        }
    }


    return null;
}
