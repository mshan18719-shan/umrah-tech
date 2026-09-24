'use client'
import React, { useRef, useState } from 'react'
import { useHotelList } from '../HotelListingContext'
import { Autocomplete, CloseButton } from '@mantine/core';
import { IoSearchOutline } from 'react-icons/io5';

export default function SearchBar() {
    const { hotelNames, setSearch, search } = useHotelList();
    const inputRef = useRef(null);
    const [dropdownOpened, setDropdownOpened] = useState(false);
    const hasValue = Boolean(String(search || '').trim());

    const focusAndOpen = () => {
        setDropdownOpened(true);
        requestAnimationFrame(() => {
            inputRef.current?.focus();
            setTimeout(() => {
                inputRef.current?.focus();
                setDropdownOpened(true);
            }, 0);
        });
    };

    const handleClear = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        setSearch(null);
        focusAndOpen();
    };

    return (
        <div className='hotel-filter-section'>
            <p className='hotel-filter-section__label'>Search By Name</p>
            <div className="hotel-filter-search-wrap">
                <IoSearchOutline className="hotel-filter-search-icon" aria-hidden="true" />
                <Autocomplete
                    ref={inputRef}
                    value={search || ''}
                    onChange={(value) => setSearch(value?.trim() ? value : null)}
                    placeholder="Hotel name"
                    data={hotelNames || []}
                    limit={10}
                    withScrollArea={false}
                    maxDropdownHeight={200}
                    className="hotel-filter-search-input"
                    dropdownOpened={dropdownOpened}
                    onDropdownOpen={() => setDropdownOpened(true)}
                    onDropdownClose={() => setDropdownOpened(false)}
                    rightSection={
                        hasValue ? (
                            <CloseButton
                                size="sm"
                                aria-label="Clear hotel search"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleClear}
                            />
                        ) : null
                    }
                    rightSectionPointerEvents="all"
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
