'use client';
import React from 'react'
import { useFlightList } from '../FlightListingContext';

export default function ResetFilter({ setActiveDrawer, variant = 'button' }) {
    const { resetFilters } = useFlightList();

    const handleReset = () => {
        if (typeof setActiveDrawer === 'function') {
            setActiveDrawer(null);
        }
        resetFilters();
    };

    if (variant === 'link') {
        return (
            <button type="button" onClick={handleReset} className="hotel-filter-clear-all">
                Clear all
            </button>
        );
    }

    return (
        <div className="hotel-filter-reset">
            <button type="button" onClick={handleReset} className="hotel-filter-reset__btn">
                Clear all
            </button>
        </div>
    );
}
