'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';

export default function AirlineFilter() {
    const { selectedAirlines, setSelectedAirlines, airlinesWithCounts, setCurrentPage } = useFlightList();

    const handleAirlineChange = (airlineCode) => {
        const code = String(airlineCode || '').trim().toUpperCase();
        setSelectedAirlines(prev => {
            const normalizedPrev = prev.map((c) => String(c || '').trim().toUpperCase());
            if (normalizedPrev.includes(code)) {
                return normalizedPrev.filter(a => a !== code);
            }
            return [...normalizedPrev, code];
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
                        checked={selectedAirlines.map((c) => String(c || '').trim().toUpperCase()).includes(String(airline.code || '').trim().toUpperCase())}
                        onChange={() => handleAirlineChange(airline.code)}
                    />
                ))}
            </div>
        </div>
    )
}
