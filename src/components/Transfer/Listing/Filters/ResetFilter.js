'use client'
import React from 'react'
import { useTransferList } from '../TransferListingContext'

export default function ResetFilter({ setActiveDrawer, variant = 'button' }) {
    const { resetFilters } = useTransferList();

    const handleReset = () => {
        resetFilters();
        setActiveDrawer?.(null);
    };

    if (variant === 'link') {
        return (
            <button type="button" onClick={handleReset} className="hotel-filter-clear-all">
                Clear all
            </button>
        );
    }

    return (
        <div className='hotel-filter-reset'>
            <button type="button" onClick={handleReset} className='hotel-filter-reset__btn'>
                Clear all
            </button>
        </div>
    );
}
