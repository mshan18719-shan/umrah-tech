'use client'
import React from 'react'
import { RangeSlider } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';

export default function LayoverTime() {
    const { layoverRange, setLayoverRange, minLayover, maxLayover, setCurrentPage } = useFlightList();

    const handleDurationChange = (value) => {
        setLayoverRange(value);
        setCurrentPage(1);
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Layover Time</p>
            <div className="hotel-filter-price-summary">
                <span className="hotel-filter-price-summary__min">
                    {formatDuration(layoverRange[0])}
                </span>
                <span className="hotel-filter-price-summary__max">
                    Up to {formatDuration(layoverRange[1])}
                </span>
            </div>
            <RangeSlider
                className="hotel-filter-slider mb-1"
                value={layoverRange}
                onChange={handleDurationChange}
                min={minLayover}
                max={maxLayover}
                step={1}
                color="#1B3B6F"
                minRange={1}
                label={formatDuration}
            />
        </div>
    )
}
