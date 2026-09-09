'use client'
import React from 'react'
import { useHotelList } from '../HotelListingContext'
import { Autocomplete } from '@mantine/core';
import { IoSearchOutline } from 'react-icons/io5';

export default function SearchBar() {
    const { hotelNames, setSearch, search } = useHotelList();
    return (
        <div className='hotel-filter-section'>
            <p className='hotel-filter-section__label'>Search By Name</p>
            <div className="hotel-filter-search-wrap">
                <IoSearchOutline className="hotel-filter-search-icon" aria-hidden="true" />
                <Autocomplete
                    value={search || ''}
                    onChange={(value) => setSearch(value)}
                    placeholder="Hotel name"
                    data={hotelNames || []}
                    limit={10}
                    withScrollArea={false}
                    maxDropdownHeight={200}
                    className="hotel-filter-search-input"
                    comboboxProps={{
                        withinPortal: false,
                        zIndex: 10000,
                        transitionProps: { duration: 0 }
                    }}
                />
            </div>
        </div>
    )
}
