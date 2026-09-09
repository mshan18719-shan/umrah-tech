'use client'
import React from 'react'
import { RangeSlider } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';

export default function JourneyDuration() {
    const { durationRange, setDurationRange, minDuration, maxDuration, setCurrentPage } = useFlightList();

    const handleDurationChange = (value) => {
        setDurationRange(value);
        setCurrentPage(1);
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Journey Duration</p>
            <div className="hotel-filter-price-summary">
                <span className="hotel-filter-price-summary__min">
                    {formatDuration(durationRange[0])}
                </span>
                <span className="hotel-filter-price-summary__max">
                    Up to {formatDuration(durationRange[1])}
                </span>
            </div>
            <RangeSlider
                className="hotel-filter-slider mb-1"
                value={durationRange}
                onChange={handleDurationChange}
                color="#1B3B6F"
                min={minDuration}
                max={maxDuration}
                step={1}
                minRange={1}
                label={formatDuration}
            />
        </div>
    )
}
