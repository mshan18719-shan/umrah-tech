'use client'
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaPlane, FaTimes, FaCheck, FaSearch } from 'react-icons/fa';
import { AirportList } from "@/util/AirportList";
import styles from './MobileAirportSelector.module.css';

export default function MobileAirportSelector({ 
    isOpen, 
    onClose, 
    onSelect, 
    selectedValue, 
    excludeCode,
    label,
    type, // 'from' or 'to'
    recentAirports = []
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const modalRef = useRef(null);
    const listRef = useRef(null);
    const searchInputRef = useRef(null);
    const touchStartY = useRef(0);

    // iOS: lock page/visual-viewport pan while the keyboard is open. Only the
    // airport list may scroll; rubber-banding at its edges is blocked so the
    // header cannot be dragged off-screen.
    useEffect(() => {
        if (!isOpen) return;

        const html = document.documentElement;
        const body = document.body;
        const scrollY = window.scrollY;
        const prev = {
            htmlOverflow: html.style.overflow,
            htmlHeight: html.style.height,
            htmlBackground: html.style.backgroundColor,
            bodyOverflow: body.style.overflow,
            bodyPosition: body.style.position,
            bodyTop: body.style.top,
            bodyLeft: body.style.left,
            bodyRight: body.style.right,
            bodyWidth: body.style.width,
            bodyHeight: body.style.height,
            bodyBackground: body.style.backgroundColor,
        };

        html.style.overflow = 'hidden';
        html.style.height = '100%';
        html.style.backgroundColor = '#ffffff';
        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
        body.style.height = '100%';
        body.style.backgroundColor = '#ffffff';

        const pinModal = () => {
            const modal = modalRef.current;
            if (!modal) return;
            const vv = window.visualViewport;
            const height = vv ? vv.height : window.innerHeight;
            modal.style.setProperty('top', `${vv ? vv.offsetTop : 0}px`, 'important');
            modal.style.setProperty('left', '0px', 'important');
            modal.style.setProperty('right', '0px', 'important');
            modal.style.setProperty('bottom', 'auto', 'important');
            modal.style.setProperty('height', `${height}px`, 'important');
            modal.style.setProperty('max-height', `${height}px`, 'important');
        };

        const freezePageScroll = () => {
            window.scrollTo(0, 0);
            html.scrollTop = 0;
            body.scrollTop = 0;
            pinModal();
        };

        const onTouchStart = (event) => {
            if (event.touches[0]) {
                touchStartY.current = event.touches[0].clientY;
            }
        };

        const onTouchMove = (event) => {
            if (event.touches.length !== 1) {
                event.preventDefault();
                return;
            }

            const target = event.target;
            if (target instanceof Element && target.closest('input, textarea')) {
                return;
            }

            const list = listRef.current;
            const inList = list && target instanceof Node && list.contains(target);
            if (!inList) {
                event.preventDefault();
                freezePageScroll();
                return;
            }

            const deltaY = event.touches[0].clientY - touchStartY.current;
            const maxScroll = list.scrollHeight - list.clientHeight;
            const atTop = list.scrollTop <= 0;
            const atBottom = list.scrollTop >= maxScroll - 1;
            if (maxScroll <= 0 || (atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
                event.preventDefault();
                freezePageScroll();
            }
        };

        pinModal();
        requestAnimationFrame(pinModal);
        document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
        document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
        window.addEventListener('scroll', freezePageScroll, { passive: false });
        window.visualViewport?.addEventListener('resize', pinModal);
        window.visualViewport?.addEventListener('scroll', freezePageScroll);

        const focusTimer = window.setTimeout(() => {
            searchInputRef.current?.focus({ preventScroll: true });
        }, 50);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('touchstart', onTouchStart, { capture: true });
            document.removeEventListener('touchmove', onTouchMove, { capture: true });
            window.removeEventListener('scroll', freezePageScroll);
            window.visualViewport?.removeEventListener('resize', pinModal);
            window.visualViewport?.removeEventListener('scroll', freezePageScroll);
            html.style.overflow = prev.htmlOverflow;
            html.style.height = prev.htmlHeight;
            html.style.backgroundColor = prev.htmlBackground;
            body.style.overflow = prev.bodyOverflow;
            body.style.position = prev.bodyPosition;
            body.style.top = prev.bodyTop;
            body.style.left = prev.bodyLeft;
            body.style.right = prev.bodyRight;
            body.style.width = prev.bodyWidth;
            body.style.height = prev.bodyHeight;
            body.style.backgroundColor = prev.bodyBackground;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    // Filter airports based on search query and organize by country
    const filterAirports = (airports, query, selectedCode = null) => {
        let filtered = airports;

        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = airports.filter(airport =>
                airport.airportName.toLowerCase().includes(lowerQuery) ||
                airport.airportCode.toLowerCase().includes(lowerQuery) ||
                airport.cityName.toLowerCase().includes(lowerQuery) ||
                airport.countryName.toLowerCase().includes(lowerQuery)
            );
        }

        // Move selected airport to top if it exists in filtered results
        if (selectedCode) {
            const selectedIndex = filtered.findIndex(a => a.airportCode === selectedCode);
            if (selectedIndex > -1) {
                const selectedAirport = filtered.splice(selectedIndex, 1)[0];
                filtered.unshift(selectedAirport);
            }
        }

        // Group by country
        const groupedByCountry = filtered.reduce((acc, airport) => {
            const country = airport.countryName;
            if (!acc[country]) {
                acc[country] = [];
            }
            acc[country].push(airport);
            return acc;
        }, {});

        // Convert to array of countries with their airports
        const countriesArray = Object.entries(groupedByCountry)
            .map(([country, airports]) => ({
                country,
                airports: airports.slice(0, 20) // Max 20 airports per country
            }))
            .slice(0, 15); // Max 15 countries

        return countriesArray;
    };

    // Get airports to display
    const getAirportsToDisplay = () => {
        if (searchQuery) {
            // Show filtered results when user is typing
            return filterAirports(
                excludeCode ? AirportList.filter(a => a.airportCode !== excludeCode) : AirportList,
                searchQuery,
                selectedValue
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

    const handleSelect = (airportCode) => {
        onSelect(airportCode);
        setSearchQuery('');
    };

    const handleClose = () => {
        setSearchQuery('');
        onClose();
    };

    if (!isOpen) return null;

    // Ensure we're in the browser before using createPortal
    if (typeof window === 'undefined') return null;

    const modalContent = (
        <>
            <div className={styles.screenCover} aria-hidden="true" />
            <div className={styles.mobileAirportSelector} ref={modalRef}>
            <div className={styles.stickyChrome}>
                <div className={styles.header}>
                    <button 
                        className={styles.closeButton} 
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <FaTimes />
                    </button>
                    <h2 className={styles.title}>{label}</h2>
                </div>

                <div className={styles.searchContainer}>
                    <div className={styles.searchWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search by airport, city or country..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            ref={searchInputRef}
                            enterKeyHint="search"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
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
            </div>

            {/* Airport List */}
            <div className={styles.airportListContainer} ref={listRef}>
                {totalAirports > 0 ? (
                    groupedAirports.map((group, groupIndex) => (
                        <div key={`${group.country}-${groupIndex}`} className={styles.countryGroup}>
                            <div className={styles.countryHeader}>
                                {!searchQuery ? 'Recent Searches' : group.country}
                                {selectedValue && group.airports.find(a => a.airportCode === selectedValue) && (
                                    <span className={styles.selectedBadge}>Current</span>
                                )}
                            </div>
                            {group.airports.map((airport) => (
                                <div
                                    key={airport.airportCode}
                                    className={`${styles.airportOption} ${selectedValue === airport.airportCode ? styles.selected : ''}`}
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
                                            {airport.cityName}, {airport.countryName}
                                        </div>
                                    </div>
                                    {selectedValue === airport.airportCode && (
                                        <div className={styles.checkmarkWrapper}>
                                            <FaCheck className={styles.checkmark} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <FaPlane className={styles.emptyIcon} />
                        <p className={styles.emptyText}>
                            {searchQuery 
                                ? 'No airports found' 
                                : type === 'from' 
                                    ? 'Start typing to search departure airports...' 
                                    : 'Start typing to search destination airports...'}
                        </p>
                    </div>
                )}
            </div>
            </div>
        </>
    );

    // Render using portal to ensure it's at the root level
    return createPortal(modalContent, document.body);
}
