'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Popover } from "@mantine/core";
import { FaMapMarkerAlt, FaTimes, FaHotel, FaCity, FaGlobeAmericas, FaSearch, FaCheck } from 'react-icons/fa';
import { FaLocationPin } from "react-icons/fa6";
import styles from './HotelLocationSelector.module.css';
import homeStyles from './FlightSearchHome.module.css';
import listingStyles from './UmrahGetAwayListing.module.css';
import MobileHotelLocationSelector from './MobileHotelLocationSelector';
import { useDropdownScrollLock } from './useDropdownScrollLock';

export default function HotelLocationSelector({
    value,
    onChange,
    onPlaceSelected,
    isMobile,
    onLoadingChange,
    variant = 'default',
    city = '',
    country = '',
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaceDetailsLoading, setIsPlaceDetailsLoading] = useState(false);
    const [mobileModalOpen, setMobileModalOpen] = useState(false);
    const inputRef = useRef(null);
    const dropdownContentRef = useRef(null);
    const dropdownSearchRef = useRef(null);
    const searchTimeout = useRef(null);

    // Popular destinations
    const popularDestinations = [
        { name: 'Makkah', country: 'Saudi Arabia', icon: '🕋', placeId: 'ChIJqVPl4WdmwxURkq3mVvmZ8Ak' },
        { name: 'Madinah', country: 'Saudi Arabia', icon: '🕌', placeId: 'ChIJ4VIcbGeDxhURFEz7tq5z4Vc' },
        { name: 'Dubai', country: 'United Arab Emirates', icon: '🏙️', placeId: 'ChIJRcbZaklDXz4RYlEphFBu5r0' },
        { name: 'Istanbul', country: 'Turkey', icon: '🏛️', placeId: 'ChIJawhoAASnyhQR0LABvJj-zOE' },
        { name: 'London', country: 'United Kingdom', icon: '🎡', placeId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI' },
        { name: 'Paris', country: 'France', icon: '🗼', placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ' },
    ];

    // Load recent searches from localStorage
    useEffect(() => {
        const savedRecent = localStorage.getItem('recentHotelSearches');
        if (savedRecent) {
            setRecentSearches(JSON.parse(savedRecent));
        }
    }, []);

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

    // Update recent search with full location details
    const updateRecentSearchWithDetails = useCallback((locationName, details) => {
        const recent = JSON.parse(localStorage.getItem('recentHotelSearches') || '[]');
        const index = recent.findIndex(item => item.name === locationName);
        
        if (index !== -1) {
            recent[index] = {
                ...recent[index],
                lat: details.lat,
                lng: details.lng,
                city: details.city,
                code: details.code,
                country: details.countryFull || recent[index].country
            };
            setRecentSearches(recent);
            localStorage.setItem('recentHotelSearches', JSON.stringify(recent));
        }
    }, []);

    // Get place details via REST API
    const getPlaceDetails = useCallback(async (placeId, displayName = null) => {
        if (!placeId) return;

        setIsPlaceDetailsLoading(true);
        if (onLoadingChange) onLoadingChange(true);

        try {
            const response = await fetch(
                `/api/places/details?place_id=${placeId}`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.result) {
                const place = data.result;
                // Add display name to the result
                const placeWithDisplayName = {
                    ...place,
                    displayName: displayName
                };
                onPlaceSelected(placeWithDisplayName);
                
                // Extract details to update recent searches
                if (displayName) {
                    const lat = place.geometry?.location?.lat;
                    const lng = place.geometry?.location?.lng;
                    let city = "";
                    let countryFull = "";
                    let code = "";
                    
                    place.address_components?.forEach((component) => {
                        if (component.types.includes("locality")) {
                            city = component.long_name;
                        } else if (component.types.includes("postal_town")) {
                            city = component.long_name;
                        }
                        if (component.types.includes("country")) {
                            countryFull = component.long_name;
                            code = component.short_name;
                        }
                    });
                    
                    // Update recent search with full details
                    updateRecentSearchWithDetails(displayName, {
                        lat, lng, city, code, countryFull
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching place details:', error);
        } finally {
            setIsPlaceDetailsLoading(false);
            if (onLoadingChange) onLoadingChange(false);
        }
    }, [onPlaceSelected, updateRecentSearchWithDetails, onLoadingChange]);

    // Add to recent searches
    const addToRecentSearches = (location) => {
        if (!location.name) return;

        // Remove if already exists
        const filtered = recentSearches.filter(item =>
            item.name !== location.name 
        );

        // Add to beginning
        const newList = [location, ...filtered].slice(0, 5);

        setRecentSearches(newList);
        localStorage.removeItem('recentHotelSearches');
        localStorage.setItem('recentHotelSearches', JSON.stringify(newList));
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
            icon: '🏙️',
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
        if (inputRef.current) {
            inputRef.current.value = location.name;
            onChange({ target: { value: location.name } });
        }

        addToRecentSearches(location);

        // If we have all the details stored, use them directly without API call
        if (location.lat && location.lng && location.city && location.code && location.country) {
            // Create a place object that matches what onPlaceSelected expects
            const placeObject = {
                geometry: {
                    location: {
                        lat: location.lat,
                        lng: location.lng
                    }
                },
                address_components: [
                    { types: ['locality'], long_name: location.city },
                    { types: ['country'], long_name: location.country, short_name: location.code }
                ],
                displayName: location.name,
                formatted_address: `${location.name}, ${location.country}`
            };
            onPlaceSelected(placeObject);
        } else {
            // Fall back to API call if details not available (old entries)
            if (location.placeId) {
                getPlaceDetails(location.placeId, location.name);
            }
        }

        setDropdownOpen(false);
        setSearchQuery('');
        setPredictions([]);
    };

    const handleClear = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onChange({ target: { value: '' } });
        setSearchQuery('');
        setPredictions([]);
        setMobileModalOpen(false);
        // Re-open dropdown with search focused so user can type a new destination
        if (variant === 'home' || variant === 'listing') {
            openDropdown(() => setDropdownOpen(true));
            setTimeout(() => {
                dropdownSearchRef.current?.focus({ preventScroll: true });
            }, 0);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        onChange(e);
        if (!dropdownOpen) {
            openDropdown(() => setDropdownOpen(true));
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
                            placeholder="Search destinations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
                <div className={styles.dropdownContent} ref={dropdownContentRef}>
                    {/* Search Results from Google API */}
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

                    {!searchQuery && recentSearches.length === 0 && (
                        <div className={styles.section}>
                            <div className={styles.emptyState}>
                                Start typing to search destinations...
                            </div>
                        </div>
                    )}

                    {!searchQuery && recentSearches.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                Recent Searches
                            </div>
                            {recentSearches.map((location, index) => (
                                <div
                                    key={`recent-${index}`}
                                    className={`${styles.locationOption} ${value === location.name ? styles.selectedLocation : ''}`}
                                    onClick={() => handleLocationSelect(location)}
                                >
                                    <div className={styles.locationIconWrapper}>
                                        <span className={styles.emojiIcon}><FaMapMarkerAlt />   </span>
                                    </div>
                                    <div className={styles.locationDetails}>
                                        <div className={styles.locationName}>{location.name}</div>
                                        <div className={styles.locationCountry}>{location.country}</div>
                                    </div>
                                    {value === location.name && (
                                        <div className={styles.checkIcon}>
                                            <FaCheck />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* {!searchQuery && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <FaGlobeAmericas className={styles.sectionIcon} />
                                Popular Destinations
                            </div>
                            {popularDestinations.map((location) => (
                                <div
                                    key={location.placeId}
                                    className={`${styles.locationOption} ${value === location.name ? styles.selectedLocation : ''}`}
                                    onClick={() => handleLocationSelect(location)}
                                >
                                    <div className={styles.locationIconWrapper}>
                                        <span className={styles.emojiIcon}>{location.icon}</span>
                                    </div>
                                    <div className={styles.locationDetails}>
                                        <div className={styles.locationName}>{location.name}</div>
                                        <div className={styles.locationCountry}>{location.country}</div>
                                    </div>
                                    {value === location.name && (
                                        <div className={styles.checkIcon}>
                                            <FaCheck />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )} */}

                </div>
            </Popover.Dropdown>
        );

        if (variant === 'listing') {
            return (
                <>
                    <input
                        type="hidden"
                        name="hotellocation"
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
                                    <span className={listingStyles.fieldLabel}>WHERE TO?</span>
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
                                                placeholder="Select destination"
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
                                                aria-label="Search destination"
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
                        name="hotellocation"
                        value={value}
                        ref={inputRef}
                    />
                    <Popover
                        {...popoverConfig}
                    >
                        <Popover.Target>
                            <div className={homeStyles.homeField} onClick={handleDropdownOpen}>
                                <span className={homeStyles.homeFieldLabel}>Where to?</span>
                                {value ? (
                                    <>
                                        <span className={homeStyles.homeFieldCode}>{displayMain}</span>
                                        {displaySub && (
                                            <span className={homeStyles.homeFieldSub}>{displaySub}</span>
                                        )}
                                    </>
                                ) : (
                                    <span className={homeStyles.homeFieldPlaceholder}>Select destination</span>
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
                            id="floatingInput"
                            name="hotellocation"
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
                        <label htmlFor="floatingInput" style={{ paddingLeft: '40px' }}>Where to?</label>
                    </div>
                </Popover.Target>
                {dropdownPanel}
            </Popover>
        );
    }

    // Handle mobile selection
    const handleMobileSelect = (selection) => {
        if (selection.type === 'prediction') {
            // Handle prediction selection
            if (inputRef.current) {
                inputRef.current.value = selection.mainText;
                onChange({ target: { value: selection.mainText } });
            }

            // Save to recent searches
            const locationData = {
                name: selection.mainText,
                country: selection.secondaryText,
                icon: '🏙️',
                placeId: selection.prediction.place_id
            };
            addToRecentSearches(locationData);

            // Get place details with display name
            getPlaceDetails(selection.prediction.place_id, selection.mainText);
        } else if (selection.type === 'recent' || selection.type === 'popular') {
            // Handle recent/popular selection
            const location = selection.location;
            
            if (inputRef.current) {
                inputRef.current.value = location.name;
                onChange({ target: { value: location.name } });
            }

            addToRecentSearches(location);

            // If we have all the details stored, use them directly without API call
            if (location.lat && location.lng && location.city && location.code && location.country) {
                // Create a place object that matches what onPlaceSelected expects
                const placeObject = {
                    geometry: {
                        location: {
                            lat: location.lat,
                            lng: location.lng
                        }
                    },
                    address_components: [
                        { types: ['locality'], long_name: location.city },
                        { types: ['country'], long_name: location.country, short_name: location.code }
                    ],
                    displayName: location.name,
                    formatted_address: `${location.name}, ${location.country}`
                };
                onPlaceSelected(placeObject);
            } else {
                // Fall back to API call if details not available (old entries)
                if (location.placeId) {
                    getPlaceDetails(location.placeId, location.name);
                }
            }
        }

        setMobileModalOpen(false);
    };

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
                    id="floatingInput"
                    name="hotellocation"
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
                <label htmlFor="floatingInput" style={{ paddingLeft: '40px' }}>Where to?</label>
            </div>

            <MobileHotelLocationSelector
                isOpen={mobileModalOpen}
                onClose={() => setMobileModalOpen(false)}
                onSelect={handleMobileSelect}
                selectedValue={value}
                recentSearches={recentSearches}
            />
        </>
    );
}