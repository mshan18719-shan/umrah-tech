'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useFilters } from './FilterContext';
import { IoMdClose } from 'react-icons/io';
import { IoSearchOutline } from 'react-icons/io5';
import styles from './UmrahFilter.module.css';

export default function SearchBar({ city = 'makkah' }) {
    const {
        makkahHotelSearch, setMakkahHotelSearch,
        madinahHotelSearch, setMadinahHotelSearch,
        makkahHotelNames,
        madinahHotelNames,
    } = useFilters();

    const hotelNames = city === 'makkah' ? makkahHotelNames : madinahHotelNames;
    const searchValue = city === 'makkah' ? makkahHotelSearch : madinahHotelSearch;
    const setSearchValue = city === 'makkah' ? setMakkahHotelSearch : setMadinahHotelSearch;

    const [inputValue, setInputValue] = useState(searchValue);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!searchValue) setInputValue('');
    }, [searchValue]);

    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = inputValue.trim()
        ? hotelNames.filter(n => n.toLowerCase().includes(inputValue.toLowerCase()))
        : hotelNames;

    const handleInput = (e) => {
        const val = e.target.value;
        setInputValue(val);
        if (!val.trim()) setSearchValue('');
        setOpen(true);
    };

    const handleSelect = (name) => {
        setInputValue(name);
        setSearchValue(name);
        setOpen(false);
    };

    const handleClear = () => {
        setInputValue('');
        setSearchValue('');
        setOpen(false);
    };

    return (
        <div className="hotel-filter-section" ref={wrapperRef} style={{ position: 'relative' }}>
            <p className="hotel-filter-section__label">Search By Name</p>
            <div className="hotel-filter-search-wrap" style={{ position: 'relative' }}>
                <IoSearchOutline className="hotel-filter-search-icon" aria-hidden="true" />
                <div style={{ position: 'relative', width: '100%' }}>
                    <input
                        type="text"
                        className={`${styles.searchInput} hotel-filter-umrah-search`}
                        placeholder="Hotel name"
                        value={inputValue}
                        onChange={handleInput}
                        onFocus={() => setOpen(true)}
                        autoComplete="off"
                    />
                    {inputValue && (
                        <span className={styles.searchClear} onClick={handleClear}>
                            <IoMdClose size={15} />
                        </span>
                    )}
                </div>
            </div>

            {open && filtered.length > 0 && (
                <ul className={styles.searchDropdown}>
                    {filtered.map(name => (
                        <li
                            key={name}
                            onMouseDown={() => handleSelect(name)}
                            className={styles.searchOption}
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
