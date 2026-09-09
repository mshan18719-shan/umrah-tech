'use client'
import React from 'react';
import { Popover } from "@mantine/core";
import { FaPlane, FaTimes, FaCheck } from 'react-icons/fa';
import { AirportList } from "@/util/AirportList";
import styles from './FlightSearch.module.css';
import MobileAirportSelector from './MobileAirportSelector';

export default function GeneralAirportSelector({
    value,
    onChange,
    excludeCode,
    label,
    type, // 'from' or 'to'
    isMobile,
    dropdownOpen,
    setDropdownOpen,
    searchQuery,
    setSearchQuery,
    recentAirports,
    addToRecentAirports,
    filterAirports,
    getAirportLabel
}) {

    // Get airports to display
    const getAirportsToDisplay = () => {
        if (searchQuery) {
            // Show filtered results when user is typing
            return filterAirports(
                excludeCode ? AirportList.filter(a => a.airportCode !== excludeCode) : AirportList,
                searchQuery,
                value
            );
        } else {
            // Show recent airports when no search query
            if (recentAirports.length > 0) {
                const recentAirportsList = recentAirports
                    .map(code => AirportList.find(a => a.airportCode === code))
                    .filter(Boolean)
                    .filter(airport => !excludeCode || airport.airportCode !== excludeCode);

                if (recentAirportsList.length > 0) {
                    // Group recent airports by country
                    const groupedByCountry = recentAirportsList.reduce((acc, airport) => {
                        const country = airport.countryName;
                        if (!acc[country]) {
                            acc[country] = [];
                        }
                        acc[country].push(airport);
                        return acc;
                    }, {});

                    return Object.entries(groupedByCountry).map(([country, airports]) => ({
                        country,
                        airports
                    }));
                }
            }
            return [];
        }
    };

    const groupedAirports = getAirportsToDisplay();
    const totalAirports = groupedAirports.reduce((sum, group) => sum + group.airports.length, 0);

    // Handle airport selection
    const handleSelect = (airportCode) => {
        onChange(airportCode);
        addToRecentAirports(airportCode, type);
        setDropdownOpen(false);
        setSearchQuery('');
    };

    // Handle clear button
    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
    };

    // Handle dropdown open
    const handleDropdownOpen = () => {
        setSearchQuery(''); // Clear search when opening dropdown
        setDropdownOpen(true);
    };

    const searchchange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Mobile view - Use fullscreen selector
    if (isMobile) {
        return (
            <>
                <div className="form-floating w-100 position-relative">
                    <input
                        type="text"
                        id={`${type}AirportInput`}
                        style={{ paddingLeft: '40px', paddingRight: value ? '40px' : '12px', cursor: 'pointer' }}
                        className="form-control hotel-date-range"
                        placeholder=" "
                        value={getAirportLabel(value)}
                        onClick={() => setDropdownOpen(true)}
                        readOnly
                    />
                    {value && (
                        <button
                            className={styles.clearButton}
                            onClick={handleClear}
                            type="button"
                            aria-label="Clear selection"
                        >
                            <FaTimes />
                        </button>
                    )}
                    <label style={{ paddingLeft: '40px' }} htmlFor={`${type}AirportInput`}>{label}</label>
                </div>

                <MobileAirportSelector
                    isOpen={dropdownOpen}
                    onClose={() => setDropdownOpen(false)}
                    onSelect={handleSelect}
                    selectedValue={value}
                    excludeCode={excludeCode}
                    label={label}
                    type={type}
                    recentAirports={recentAirports}
                />
            </>
        );
    }

    // Desktop popover view
    return (
        <Popover
            opened={dropdownOpen}
            onChange={setDropdownOpen}
            position="bottom-start"
            width="target"
            shadow="md"
            offset={8}
            clickOutsideEvents={["mouseup", "touchend"]}
            middlewares={{ flip: false, shift: false }}
        >
            <Popover.Target>
                <div className="form-floating w-100 position-relative">
                    <input
                        type="text"
                        id={`${type}AirportInput`}
                        style={{ paddingLeft: '40px', paddingRight: value ? '40px' : '12px', cursor: 'pointer' }}
                        className="form-control hotel-date-range"
                        placeholder=" "
                        value={getAirportLabel(value)}
                        onClick={handleDropdownOpen}
                        readOnly
                    />
                    {value && (
                        <button
                            className={styles.clearButton}
                            onClick={handleClear}
                            type="button"
                            aria-label="Clear selection"
                        >
                            <FaTimes />
                        </button>
                    )}
                    <label style={{ paddingLeft: '40px' }} htmlFor={`${type}AirportInput`}>{label}</label>
                </div>
            </Popover.Target>
            <Popover.Dropdown className={styles.customDropdown}>
                <div className={styles.searchWrapper}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search airports..."
                        value={searchQuery}
                        onChange={searchchange}
                        autoFocus
                    />
                </div>
                <div className={styles.airportList}>
                    {totalAirports > 0 ? (
                        groupedAirports.map((group, groupIndex) => (
                            <React.Fragment key={group.country}>
                                <div className={styles.countryHeader}>
                                    {!searchQuery ? (groupIndex === 0 ? 'Recent Searches' : '') : group.country}
                                    {value && group.airports.find(a => a.airportCode === value) && (
                                        <span className={styles.selectedBadge}>Current</span>
                                    )}
                                </div>
                                {group.airports.map((airport) => (
                                    <div
                                        key={airport.airportCode}
                                        className={`${styles.airportOption} ${value === airport.airportCode ? styles.selected : ''}`}
                                        onClick={() => handleSelect(airport.airportCode)}
                                    >
                                        <div className={styles.airportIconWrapper}>
                                            <FaPlane className={styles.airportIcon} />
                                        </div>
                                        <div className={styles.airportDetails}>
                                            <div className={styles.airportMainInfo}>
                                                <span className={styles.airportName}>{airport.airportName}</span>
                                                <span className={styles.airportCode}>({airport.airportCode})</span>
                                            </div>
                                            <div className={styles.airportLocation}>
                                                {airport.cityName}
                                            </div>
                                        </div>
                                            {value === airport.airportCode && (
                                                <div className={styles.checkmarkWrapper}>
                                                    <FaCheck className={styles.checkmark} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                {searchQuery ? 'No airports found' : (type === 'from' ? 'Start typing to search leaving airports...' : 'Start typing to search destination airports...')}
                            </div>
                        )}
                    </div>
                </Popover.Dropdown>
            </Popover>
        );
    }
