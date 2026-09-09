'use client';
import React from 'react'
import { usePackageList } from "../PackageListingContext";

export default function ResetFilter({ setActiveDrawer }) {
    const { resetFilters } = usePackageList();
    const handleReset = () => {
        if (setActiveDrawer) {
            setActiveDrawer(null);
        }
        resetFilters();
    };
    return (
        <div className='text-end mt-3'>
            <p onClick={handleReset} className='small text-primary cursor-pointer'>Reset filter ?</p>
        </div>
    )
}
