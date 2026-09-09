'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Popover } from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { FaMapMarkerAlt, FaTimes, FaSearch, FaGlobeAmericas, FaCheck } from 'react-icons/fa';
import styles from './HotelLocationSelector.module.css';
import homeStyles from './FlightSearchHome.module.css';
import listingStyles from './UmrahGetAwayListing.module.css';
import MobileTransferLocationSelector from './MobileTransferLocationSelector';
import { useDropdownScrollLock } from './useDropdownScrollLock';

export default function TransferLocationSelector({
    value,
    onChange,
    onPlaceSelected,
    detailLoader,
    isMobile,
    label = "Location",
    placeholder = "Enter location",
    inputName = "transferLocation",
    variant = 'default',
    city = '',
    country = '',
    fieldLabel = '',
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileModalOpen, setMobileModalOpen] = useState(false);
    const inputRef = useRef(null);
    const dropdownContentRef = useRef(null);
    const dropdownSearchRef = useRef(null);
    const searchTimeout = useRef(null);

    // Popular destinations for transfers
    const popularDestinations = [
        { name: 'Jeddah Airport', country: 'Saudi Arabia', icon: '✈️', placeId: 'ChIJm0kSHuldwxURNFByRg7r-Dg' },
        { name: 'Makkah', country: 'Saudi Arabia', icon: '🕋', placeId: 'ChIJqVPl4WdmwxURkq3mVvmZ8Ak' },
        { name: 'Madinah', country: 'Saudi Arabia', icon: '🕌', placeId: 'ChIJ4VIcbGeDxhURFEz7tq5z4Vc' },
        { name: 'Dubai Airport', country: 'United Arab Emirates', icon: '✈️', placeId: 'ChIJvRKfbfVDXz4R-9nf8tN1RRA' },
        { name: 'Riyadh Airport', country: 'Saudi Arabia', icon: '✈️', placeId: 'ChIJp5PeVdaEXz4R9Y4gvUdI5zE' },
        { name: 'Istanbul Airport', country: 'Turkey', icon: '✈️', placeId: 'ChIJ_UnBV0CzyhQRWh5tDp-0PrQ' },
    ];

    // Load recent searches from localStorage
    useEffect(() => {
        const savedRecent = localStorage.getItem(`recentTransferSearches_${inputName}`);
        if (savedRecent) {
            setRecentSearches(JSON.parse(savedRecent));
        }
    }, [inputName]);

    // Search Google Places API via REST
    const searchPlaces = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setPredictions([]);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(
                `/api/places/autocomplete?input=${encodeURIComponent(query)}`
            );
            const data = await response.json();

            setIsLoading(false);

            if (data.status === 'OK' && data.predictions) {
                setPredictions(data.predictions.slice(0, 8)); // Limit to 8 results
            } else {
                setPredictions([]);
            }
        } catch (error) {
            console.error('Error fetching places:', error);
            setIsLoading(false);
            setPredictions([]);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (searchQuery) {
            searchTimeout.current = setTimeout(() => {
                searchPlaces(searchQuery);
            }, 300);
        } else {
            setPredictions([]);
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery, searchPlaces]);

    const { openDropdown, handleOpenClick, createOpenChangeHandler } = useDropdownScrollLock(
        dropdownOpen,
        dropdownSearchRef,
        dropdownContentRef
    );

    const handleDropdownOpen = (e) => {
        handleOpenClick(e, () => setDropdownOpen(true));
    };

    const handlePopoverChange = createOpenChangeHandler(setDropdownOpen);

    // Search for location and get fresh Place ID
    const searchAndGetPlaceId = useCallback(async (locationName) => {
        try {
            const response = await fetch(
                `/api/places/autocomplete?input=${encodeURIComponent(locationName)}`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
                // Get the first (best) match
                const firstMatch = data.predictions[0];
                return firstMatch.place_id;
            } else {
                console.error('No results found for:', locationName);
                notifications.show({
                    title: 'Location Not Found',
                    message: 'Could not find this location. Please search again.',
                    color: 'orange',
                });
                return null;
            }
        } catch (error) {
            console.error('Error searching for place:', error);
            return null;
        }
    }, []);

    // Get place details via REST API
    const getPlaceDetails = useCallback(async (placeId, displayName = null) => {
        if (!placeId) {
            console.warn('No placeId provided to getPlaceDetails');
            return;
        }
        detailLoader(true);
        try {
            const response = await fetch(
                `/api/places/details?place_id=${placeId}`
            );
            const data = await response.json();

            detailLoader(false);
            if (data.status === 'OK' && data.result) {
                // Add display name to the result
                const placeWithDisplayName = {
                    ...data.result,
                    displayName: displayName || data.result.name
                };
                onPlaceSelected(placeWithDisplayName);
            } else {
                console.error('Place details API error:', data.status, data.error_message);
                notifications.show({
                    title: 'Location Error',
                    message: 'Could not load location details. Please try searching again.',
                    color: 'red',
                });
            }
        } catch (error) {
            detailLoader(false);
            console.error('Error fetching place details:', error);
        }
    }, [onPlaceSelected]);

    // Add to recent searches
    const addToRecentSearches = (location) => {
        if (!location.name) return;

        // Check if already exists
        const alreadyExists = recentSearches.some(item =>
            item.name === location.name && item.country === location.country
        );

        // Skip if already exists
        if (alreadyExists) return;

        // Add to beginning
        const newList = [location, ...recentSearches].slice(0, 5);

        setRecentSearches(newList);
        localStorage.setItem(`recentTransferSearches_${inputName}`, JSON.stringify(newList));
    };

    const handlePredictionSelect = (prediction) => {
        const mainText = prediction.structured_formatting?.main_text || '';
        const secondaryText = prediction.structured_formatting?.secondary_text || '';

        if (inputRef.current) {
            inputRef.current.value = mainText;
            onChange({ target: { value: mainText } });
        }

        // Save to recent searches
        const locationData = {
            name: mainText,
            country: secondaryText,
            icon: '📍',
            placeId: prediction.place_id
        };
        addToRecentSearches(locationData);

        // Get place details with display name
        getPlaceDetails(prediction.place_id, mainText);

        setDropdownOpen(false);
        setSearchQuery('');
        setPredictions([]);
    };

    const handleLocationSelect = (location) => {
        // Update input field immediately for instant feedback
        if (inputRef.current) {
            inputRef.current.value = location.name;
            onChange({ target: { value: location.name } });
        }

        // Close dropdown immediately
        setDropdownOpen(false);
        setSearchQuery('');
        setPredictions([]);

        addToRecentSearches(location);

        // Run API calls in background to get fresh Place ID and coordinates
        searchAndGetPlaceId(location.name).then(freshPlaceId => {
            if (freshPlaceId) {
                // Now get full place details with the fresh ID
                getPlaceDetails(freshPlaceId, location.name);
            }
        });
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onChange({ target: { value: '' } });
        setSearchQuery('');
        setPredictions([]);
        setMobileModalOpen(false);
        openDropdown(() => setDropdownOpen(true));
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        onChange(e);
        if (!dropdownOpen) {
            openDropdown(() => setDropdownOpen(true));
        }
    };

    // Handle mobile selection
    const handleMobileSelect = (selection) => {
        if (selection.type === 'prediction') {
            // Handle prediction selection
            if (inputRef.current) {
                inputRef.current.value = selection.mainText;
                onChange({ target: { value: selection.mainText } });
            }

            // Close modal immediately
            setMobileModalOpen(false);

            // Save to recent searches
            const locationData = {
                name: selection.mainText,
                country: selection.secondaryText,
                icon: '📍',
                placeId: selection.prediction.place_id
            };
            addToRecentSearches(locationData);

            // Get place details with display name in background
            getPlaceDetails(selection.prediction.place_id, selection.mainText);
        } else if (selection.type === 'recent' || selection.type === 'popular') {
            // Handle recent/popular selection
            const location = selection.location;

            if (inputRef.current) {
                inputRef.current.value = location.name;
                onChange({ target: { value: location.name } });
            }

            // Close modal immediately
            setMobileModalOpen(false);

            addToRecentSearches(location);

            // Run API calls in background to get fresh Place ID and coordinates
            searchAndGetPlaceId(location.name).then(freshPlaceId => {
                if (freshPlaceId) {
                    // Now get full place details with the fresh ID
                    getPlaceDetails(freshPlaceId, location.name);
                }
            });
        }
    };

    // Desktop view (home/listing variants use same layout on all screen sizes)
    if (!isMobile || variant === 'home' || variant === 'listing') {
        const popoverConfig = {
            opened: dropdownOpen,
            onChange: handlePopoverChange,
            position: 'bottom-start',
            width: 'target',
            shadow: 'md',
            offset: 8,
            zIndex: 1000,
            clickOutsideEvents: ['mouseup', 'touchend'],
            middlewares: { flip: false, shift: false },
        };

        const dropdownPanel = (
            <Popover.Dropdown className={styles.customDropdown}>
                {variant === 'home' && (
                    <div className={styles.searchWrapper}>
                        <input
                            type="text"
                            ref={dropdownSearchRef}
                            className={styles.searchInput}
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
                <div className={styles.dropdownContent} ref={dropdownContentRef}>
                    {searchQuery && predictions.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <FaSearch className={styles.sectionIcon} />
                                Search Results
                            </div>
                            {predictions
                                .sort((a, b) => {
                                    const mainTextA = a.structured_formatting?.main_text || a.description;
                                    const mainTextB = b.structured_formatting?.main_text || b.description;
                                    const isSelectedA = value && mainTextA === value;
                                    const isSelectedB = value && mainTextB === value;
                                    if (isSelectedA && !isSelectedB) return -1;
                                    if (!isSelectedA && isSelectedB) return 1;
                                    return 0;
                                })
                                .map((prediction) => {
                                const mainText = prediction.structured_formatting?.main_text || prediction.description;
                                const isSelected = value && mainText === value;
                                return (
                                    <div
                                        key={prediction.place_id}
                                        className={`${styles.locationOption} ${isSelected ? styles.selectedLocation : ''}`}
                                        onClick={() => handlePredictionSelect(prediction)}
                                    >
                                        <div className={styles.locationIconWrapper}>
                                            <FaMapMarkerAlt className={styles.locationIcon} />
                                        </div>
                                        <div className={styles.locationDetails}>
                                            <div className={styles.locationName}>
                                                {mainText}
                                            </div>
                                            <div className={styles.locationCountry}>
                                                {prediction.structured_formatting?.secondary_text || ''}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className={styles.checkIcon}>
                                                <FaCheck />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {searchQuery && isLoading && (
                        <div className={styles.section}>
                            <div className='placeholder-glow p-2'>
                                <span className="placeholder col-12 mb-1 rounded" style={{ height: '36px' }}></span>
                                <span className="placeholder col-12 mb-1 rounded" style={{ height: '36px' }}></span>
                                <span className="placeholder col-12 mb-1 rounded" style={{ height: '36px' }}></span>
                                <span className="placeholder col-12 mb-1 rounded" style={{ height: '36px' }}></span>
                            </div>
                        </div>
                    )}

                    {searchQuery && !isLoading && predictions.length === 0 && (
                        <div className={styles.section}>
                            <div className={styles.emptyState}>
                                No locations found
                            </div>
                        </div>
                    )}

                    {!searchQuery && recentSearches.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <FaSearch className={styles.sectionIcon} />
                                Recent Searches
                            </div>
                            {recentSearches
                                .sort((a, b) => {
                                    const isSelectedA = value && a.name === value;
                                    const isSelectedB = value && b.name === value;
                                    if (isSelectedA && !isSelectedB) return -1;
                                    if (!isSelectedA && isSelectedB) return 1;
                                    return 0;
                                })
                                .map((location, index) => {
                                const isSelected = value && location.name === value;
                                return (
                                    <div
                                        key={`recent-${index}`}
                                        className={`${styles.locationOption} ${isSelected ? styles.selectedLocation : ''}`}
                                        onClick={() => handleLocationSelect(location)}
                                    >
                                        <div className={styles.locationIconWrapper}>
                                            <FaMapMarkerAlt className={styles.locationIcon} />
                                        </div>
                                        <div className={styles.locationDetails}>
                                            <div className={styles.locationName}>{location.name}</div>
                                            <div className={styles.locationCountry}>{location.country}</div>
                                        </div>
                                        {isSelected && (
                                            <div className={styles.checkIcon}>
                                                <FaCheck />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {!searchQuery && recentSearches.length === 0 && (
                        <div className={styles.section}>
                            <div className={styles.emptyState}>
                                <FaMapMarkerAlt size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <div>Start typing to search for locations</div>
                            </div>
                        </div>
                    )}
                </div>
            </Popover.Dropdown>
        );

        const homeFieldLabel = fieldLabel || placeholder.replace('?', '');

        if (variant === 'listing') {
            const labelText = (fieldLabel || placeholder.replace('?', '')).toUpperCase();

            return (
                <>
                    <input
                        type="hidden"
                        name={inputName}
                        value={value}
                        ref={inputRef}
                    />
                    <Popover
                        {...popoverConfig}
                    >
                        <Popover.Target>
                            <div className={listingStyles.listingField} onClick={handleDropdownOpen}>
                                <div className={`${listingStyles.fieldIcon} ${listingStyles.iconBlue}`}><FaMapMarkerAlt /></div>
                                <div className={listingStyles.fieldBody}>
                                    <span className={listingStyles.fieldLabel}>{labelText}</span>
                                    <div className={listingStyles.fieldValue} style={{ position: 'relative', paddingRight: value ? '22px' : 0 }}>
                                        {value ? (
                                            <span className={listingStyles.fieldValueText}>{value}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                className={listingStyles.selectInput}
                                                style={{
                                                    border: 'none',
                                                    outline: 'none',
                                                    boxShadow: 'none',
                                                    background: 'transparent',
                                                    padding: 0,
                                                    margin: 0,
                                                    width: '100%',
                                                }}
                                                placeholder="Select location"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    if (!dropdownOpen) {
                                                        openDropdown(() => setDropdownOpen(true));
                                                    }
                                                }}
                                                onFocus={handleDropdownOpen}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDropdownOpen(e);
                                                }}
                                                autoComplete="off"
                                                aria-label={`Search ${labelText.toLowerCase()}`}
                                            />
                                        )}
                                        {value && (
                                            <button
                                                className={listingStyles.clearButton}
                                                onClick={handleClear}
                                                type="button"
                                                aria-label="Clear selection"
                                            >
                                                <FaTimes />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Popover.Target>
                        {dropdownPanel}
                    </Popover>
                </>
            );
        }

        if (variant === 'home') {
            const displayMain = value ? (city || value) : '';
            const displaySub = value
                ? [city && city !== value ? value : null, country].filter(Boolean).join(', ').toUpperCase()
                : '';

            return (
                <div className={homeStyles.locationFieldWrap}>
                    <input
                        type="hidden"
                        name={inputName}
                        value={value}
                        ref={inputRef}
                    />
                    <Popover
                        {...popoverConfig}
                    >
                        <Popover.Target>
                            <div className={homeStyles.homeField} onClick={handleDropdownOpen}>
                                <span className={homeStyles.homeFieldLabel}>{homeFieldLabel}</span>
                                {value ? (
                                    <>
                                        <span className={homeStyles.homeFieldCode}>{displayMain}</span>
                                        {displaySub && (
                                            <span className={homeStyles.homeFieldSub}>{displaySub}</span>
                                        )}
                                    </>
                                ) : (
                                    <span className={homeStyles.homeFieldPlaceholder}>Select location</span>
                                )}
                                {value && (
                                    <button
                                        className={homeStyles.clearButton}
                                        onClick={handleClear}
                                        type="button"
                                        aria-label="Clear selection"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </Popover.Target>
                        {dropdownPanel}
                    </Popover>
                </div>
            );
        }

        return (
            <Popover
                {...popoverConfig}
            >
                <Popover.Target>
                    <div className="form-floating d-flex align-items-center w-100 position-relative">
                        <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                            <FaMapMarkerAlt size={20} />
                        </div>
                        <input
                            type="text"
                            id={inputName}
                            name={inputName}
                            className="form-control"
                            style={{ paddingLeft: '40px', paddingRight: value ? '40px' : '12px', cursor: 'text' }}
                            placeholder=" "
                            value={value}
                            onChange={handleInputChange}
                            onFocus={(e) => {
                                e.target.select();
                                handleDropdownOpen();
                            }}
                            onClick={handleDropdownOpen}
                            ref={inputRef}
                            autoComplete="off"
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
                        <label htmlFor={inputName} style={{ paddingLeft: '40px' }}>{placeholder}</label>
                    </div>
                </Popover.Target>
                {dropdownPanel}
            </Popover>
        );
    }

    // Mobile view
    return (
        <>
            <div
                className="form-floating d-flex align-items-center w-100 position-relative"
                onClick={() => setMobileModalOpen(true)}
            >
                <div className="position-absolute" style={{ left: '12px', zIndex: 1, color: '#222020bb' }}>
                    <FaMapMarkerAlt size={20} />
                </div>
                <input
                    type="text"
                    id={inputName}
                    name={inputName}
                    className="form-control"
                    style={{ paddingLeft: '40px', paddingRight: value ? '40px' : '12px', cursor: 'pointer' }}
                    placeholder=" "
                    value={value}
                    onChange={handleInputChange}
                    ref={inputRef}
                    autoComplete="off"
                    readOnly
                />
                {value && (
                    <button
                        className={styles.clearButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClear(e);
                        }}
                        type="button"
                        aria-label="Clear selection"
                    >
                        <FaTimes />
                    </button>
                )}
                <label htmlFor={inputName} style={{ paddingLeft: '40px' }}>{placeholder}</label>
            </div>

            <MobileTransferLocationSelector
                isOpen={mobileModalOpen}
                onClose={() => setMobileModalOpen(false)}
                onSelect={handleMobileSelect}
                selectedValue={value}
                recentSearches={recentSearches}
                label={placeholder}
            />
        </>
    );
}
