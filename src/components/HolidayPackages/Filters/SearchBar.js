'use client'
import React from 'react'
import { usePackageList } from '../PackageListingContext'
import { Autocomplete } from '@mantine/core';

export default function SearchBar() {
    const { hotelNames, setSearch, search } = usePackageList();
    return (
        <div className='hotel-filter'>
            <p className='small fw-bold'>Search By Hotel Name</p>
            <Autocomplete
                value={search || ''}
                onChange={(value)=>setSearch(value)}
                placeholder="Hotel name"
                data={hotelNames || []}
                limit={10}
                withScrollArea={false}
                maxDropdownHeight={200}
                comboboxProps={{ 
                    withinPortal: false,
                    zIndex: 10000,
                    transitionProps: { duration: 0 }
                }}
            />
        </div>
    )
}
