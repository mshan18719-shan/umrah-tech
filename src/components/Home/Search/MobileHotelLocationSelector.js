'use client'
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaMapMarkerAlt, FaTimes, FaCheck, FaSearch, FaGlobeAmericas } from 'react-icons/fa';
import styles from './MobileHotelLocationSelector.module.css';

export default function MobileHotelLocationSelector({ 
    isOpen, 
    onClose, 
    onSelect, 
    selectedValue,
    recentSearches = []
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Popular destinations
    const popularDestinations = [
        { name: 'Makkah', country: 'Saudi Arabia', icon: '🕋', placeId: 'ChIJqVPl4WdmwxURkq3mVvmZ8Ak' },
        { name: 'Madinah', country: 'Saudi Arabia', icon: '🕌', placeId: 'ChIJ4VIcbGeDxhURFEz7tq5z4Vc' },
        { name: 'Dubai', country: 'United Arab Emirates', icon: '🏙️', placeId: 'ChIJRcbZaklDXz4RYlEphFBu5r0' },
        { name: 'Istanbul', country: 'Turkey', icon: '🏛️', placeId: 'ChIJawhoAASnyhQR0LABvJj-zOE' },
        { name: 'London', country: 'United Kingdom', icon: '🎡', placeId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI' },
        { name: 'Paris', country: 'France', icon: '🗼', placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ' },
    ];

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
        } else {
            document.body.style.overflow = '';
            document.body.style.height = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.height = '';
        };
    }, [isOpen]);

    // Search Google Places API via REST
    const searchPlaces = async (query) => {
        if (!query || query.length < 2) {
            setPredictions([]);
            setIsLoading(false);
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
                setPredictions(data.predictions.slice(0, 8));
            } else {
                setPredictions([]);
            }
        } catch (error) {
            console.error('Error fetching places:', error);
            setIsLoading(false);
            setPredictions([]);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchQuery) {
                searchPlaces(searchQuery);
            } else {
                setPredictions([]);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleSelect = (location) => {
        onSelect(location);
        setSearchQuery('');
        setPredictions([]);
    };

    const handleClose = () => {
        setSearchQuery('');
        setPredictions([]);
        onClose();
    };

    if (!isOpen) return null;

    // Ensure we're in the browser before using createPortal
    if (typeof window === 'undefined') return null;

    const modalContent = (
        <>
            <div className={styles.screenCover} aria-hidden="true" />
            <div className={styles.mobileLocationSelector}>
            {/* Header */}
            <div className={styles.header}>
                <button 
                    className={styles.closeButton} 
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <FaTimes />
                </button>
                <h2 className={styles.title}>Select Location</h2>
            </div>

            {/* Search Box */}
            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search by hotel, city or country..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    {searchQuery && (
                        <button
                            className={styles.clearSearchButton}
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
            </div>

            {/* Location List */}
            <div className={styles.locationListContainer}>
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
                                const isSelectedA = selectedValue && mainTextA === selectedValue;
                                const isSelectedB = selectedValue && mainTextB === selectedValue;
                                if (isSelectedA && !isSelectedB) return -1;
                                if (!isSelectedA && isSelectedB) return 1;
                                return 0;
                            })
                            .map((prediction) => {
                            const mainText = prediction.structured_formatting?.main_text || prediction.description;
                            const secondaryText = prediction.structured_formatting?.secondary_text || '';
                            const isSelected = selectedValue && mainText === selectedValue;
                            
                            return (
                                <div
                                    key={prediction.place_id}
                                    className={`${styles.locationOption} ${isSelected ? styles.selectedLocation : ''}`}
                                    onClick={() => handleSelect({
                                        type: 'prediction',
                                        prediction,
                                        mainText,
                                        secondaryText
                                    })}
                                >
                                    <div className={styles.locationIconWrapper}>
                                        <FaMapMarkerAlt className={styles.locationIcon} />
                                    </div>
                                    <div className={styles.locationDetails}>
                                        <div className={styles.locationName}>
                                            {mainText}
                                        </div>
                                        <div className={styles.locationCountry}>
                                            {secondaryText}
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

                {/* Loading State */}
                {searchQuery && isLoading && (
                    <div className={styles.section}>
                        <div className='placeholder-glow p-3'>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="placeholder col-12 mb-2 rounded" style={{ height: '60px' }}></div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Results */}
                {searchQuery && !isLoading && predictions.length === 0 && (
                    <div className={styles.emptyState}>
                        <FaMapMarkerAlt className={styles.emptyIcon} />
                        <p className={styles.emptyText}>No locations found</p>
                    </div>
                )}

                {/* Recent Searches */}
                {!searchQuery && recentSearches.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FaSearch className={styles.sectionIcon} />
                            Recent Searches
                        </div>
                        {recentSearches
                            .sort((a, b) => {
                                const isSelectedA = selectedValue && a.name === selectedValue;
                                const isSelectedB = selectedValue && b.name === selectedValue;
                                if (isSelectedA && !isSelectedB) return -1;
                                if (!isSelectedA && isSelectedB) return 1;
                                return 0;
                            })
                            .map((location, index) => {
                            const isSelected = selectedValue && location.name === selectedValue;
                            return (
                                <div
                                    key={`recent-${index}`}
                                    className={`${styles.locationOption} ${isSelected ? styles.selectedLocation : ''}`}
                                    onClick={() => handleSelect({
                                        type: 'recent',
                                        location
                                    })}
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

                {/* Popular Destinations */}
                {/* {!searchQuery && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FaGlobeAmericas className={styles.sectionIcon} />
                            Popular Destinations
                        </div>
                        {popularDestinations.map((location, index) => (
                            <div
                                key={`popular-${index}`}
                                className={styles.locationOption}
                                onClick={() => handleSelect({
                                    type: 'popular',
                                    location
                                })}
                            >
                                <div className={styles.locationIconWrapper}>
                                    <FaMapMarkerAlt className={styles.locationIcon} />
                                </div>
                                <div className={styles.locationDetails}>
                                    <div className={styles.locationName}>{location.name}</div>
                                    <div className={styles.locationCountry}>{location.country}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )} */}

                {/* Empty State */}
                {!searchQuery && recentSearches.length === 0 && (
                    <div className={styles.emptyState}>
                        <FaMapMarkerAlt className={styles.emptyIcon} />
                        <p className={styles.emptyText}>Start typing to search for locations</p>
                    </div>
                )}
            </div>
        </div>
        </>
    );

    // Render using portal to ensure it's at the root level
    return createPortal(modalContent, document.body);
}
