'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';

export default function AirlineFilter() {
    const { selectedAirlines, setSelectedAirlines, airlinesWithCounts, setCurrentPage } = useFlightList();

    const handleAirlineChange = (airlineCode) => {
        setSelectedAirlines(prev => {
            if (prev.includes(airlineCode)) {
                return prev.filter(a => a !== airlineCode);
            } else {
                return [...prev, airlineCode];
            }
        });
        setCurrentPage(1);
    };

    return (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Airlines</p>
            <div className="hotel-filter-checkbox-group">
                {airlinesWithCounts.map((airline) => (
                    <Checkbox
                        key={airline.code}
                        className="hotel-filter-checkbox"
                        label={
                            <span className="flight-filter-checkbox-label">
                                <span>{airline.name}</span>
                                <span className="flight-filter-checkbox-count">{airline.count}</span>
                            </span>
                        }
                        checked={selectedAirlines.includes(airline.code)}
                        onChange={() => handleAirlineChange(airline.code)}
                    />
                ))}
            </div>
        </div>
    )
}
