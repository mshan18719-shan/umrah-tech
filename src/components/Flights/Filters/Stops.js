'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';

export default function Stops() {
    const { selectedStops, setSelectedStops, stopsWithCounts, setCurrentPage } = useFlightList();

    const handleStopChange = (stopValue) => {
        setSelectedStops(prev => {
            if (prev.includes(stopValue)) {
                return prev.filter(s => s !== stopValue);
            } else {
                return [...prev, stopValue];
            }
        });
        setCurrentPage(1);
    };

    const stopOptions = [
        { value: 0, label: 'Direct' },
        { value: 1, label: '1 stop' },
        { value: 2, label: '2+ stops' },
    ];

    return (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Stops</p>
            <div className="hotel-filter-checkbox-group">
                {stopOptions.map((option) => (
                    <Checkbox
                        key={option.value}
                        className="hotel-filter-checkbox"
                        label={
                            <span className="flight-filter-checkbox-label">
                                <span>{option.label}</span>
                                <span className="flight-filter-checkbox-count">{stopsWithCounts[option.value] || 0}</span>
                            </span>
                        }
                        checked={selectedStops.includes(option.value)}
                        onChange={() => handleStopChange(option.value)}
                    />
                ))}
            </div>
        </div>
    )
}
