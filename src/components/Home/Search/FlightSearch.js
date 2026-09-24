'use client'
import React, { useEffect, useState, useRef } from "react";
import { Select, Popover } from "@mantine/core";
import { DateInput, DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { FaCalendarAlt, FaMapMarkerAlt, FaMinus, FaPlus, FaTimes, FaPlane, FaCheck, FaBuilding, FaSearch } from "react-icons/fa";
import { AirportList } from "@/util/AirportList";
import { notifications } from "@mantine/notifications";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import moment from "moment";
import { IoIosSwap, IoMdPerson } from "react-icons/io";
import styles from './FlightSearch.module.css';
// import { Select } from "@mantine/core";      
import homeStyles from './FlightSearchHome.module.css';
import listingStyles from './FlightSearchListing.module.css';
import MobileAirportSelector from './MobileAirportSelector';
import { useDropdownScrollLock } from './useDropdownScrollLock';
function filterAirports(airports, query, selectedCode = null) {
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

    if (selectedCode) {
        const selectedIndex = filtered.findIndex(a => a.airportCode === selectedCode);
        if (selectedIndex > -1) {
            const selectedAirport = filtered.splice(selectedIndex, 1)[0];
            filtered.unshift(selectedAirport);
        }
    }

    const groupedByCountry = filtered.reduce((acc, airport) => {
        const country = airport.countryName;
        if (!acc[country]) {
            acc[country] = [];
        }
        acc[country].push(airport);
        return acc;
    }, {});

    return Object.entries(groupedByCountry)
        .map(([country, airports]) => ({
            country,
            airports: airports.slice(0, 20),
        }))
        .slice(0, 10);
}

function getAirportLabel(code) {
    const airport = AirportList.find(a => a.airportCode === code);
    return airport ? `${airport.cityName} (${airport.airportCode})` : '';
}

function getAirportDetails(code) {
    const airport = AirportList.find(a => a.airportCode === code);
    if (!airport) return null;
    return {
        code: airport.airportCode,
        city: (airport.cityName || '').toUpperCase(),
        country: (airport.countryName || '').toUpperCase(),
    };
}

function AirportDropdown({
value,
onChange,
excludeCode,
placeholder,
dropdownOpen,
setDropdownOpen,
searchQuery,
setSearchQuery,
label,
type,
dropdownVariant = 'default',
isMobile = false,
isListing = false,
recentFromAirports = [],
recentToAirports = [],
addToRecentAirports,
}) {
    // Only show recent airports if no search query, otherwise show filtered results
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
            const recentCodes = type === 'from' ? recentFromAirports : recentToAirports;
            if (recentCodes.length > 0) {
                const recentAirports = recentCodes
                    .map(code => AirportList.find(a => a.airportCode === code))
                    .filter(Boolean)
                    .filter(airport => !excludeCode || airport.airportCode !== excludeCode);

                if (recentAirports.length > 0) {
                    // Group recent airports by country
                    const groupedByCountry = recentAirports.reduce((acc, airport) => {
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
}

    const groupedAirports = getAirportsToDisplay();
    const searchInputRef = useRef(null);
    const { handleOpenClick, createOpenChangeHandler } = useDropdownScrollLock(
        dropdownOpen,
        searchInputRef
    );
    const handlePopoverChange = createOpenChangeHandler(setDropdownOpen);

    const handleSelect = (airportCode) => {
        onChange(airportCode);
        addToRecentAirports(airportCode, type);
        setDropdownOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
    };

    const handleDropdownOpen = (e) => {
        handleOpenClick(e, () => {
            setSearchQuery('');
            setDropdownOpen(true);
        });
    };

    const searchchange = (e) => {
        setSearchQuery(e.target.value);
    }
    const totalAirports = groupedAirports.reduce((sum, group) => sum + group.airports.length, 0);

    // Mobile view - Use fullscreen selector
    if (isMobile) {
        return (
            <>
                <div className="form-floating w-100 position-relative">
                    <input
                        type="text"
                        id="floatingInput"
                        style={{ paddingLeft: '12px', border: 'none', paddingRight: value ? '40px' : '12px', cursor: 'pointer' }}
                        className="form-control hotel-date-range border-0"
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
                    <label style={{ paddingLeft: '12px' }} htmlFor="floatingInput">{label}</label>
                </div>

                <MobileAirportSelector
                    isOpen={dropdownOpen}
                    onClose={() => setDropdownOpen(false)}
                    onSelect={handleSelect}
                    selectedValue={value}
                    excludeCode={excludeCode}
                    label={label}
                    type={type}
                    recentAirports={type === 'from' ? recentFromAirports : recentToAirports}
                />
            </>
        );
    }

    // Desktop home hero card
    if (dropdownVariant === 'home' && !isMobile) {
        const details = getAirportDetails(value);
        const fieldLabel = type === 'from' ? 'From' : 'To';

        return (
            <Popover
                opened={dropdownOpen}
                onChange={handlePopoverChange}
                position="bottom-start"
                width="target"
                shadow="md"
                offset={8}
                clickOutsideEvents={["mouseup", "touchend"]}
                middlewares={{ flip: false, shift: false }}
            >
                <Popover.Target>
                    <div className={homeStyles.homeField} onClick={handleDropdownOpen}>
                        <span className={homeStyles.homeFieldLabel}>{fieldLabel}</span>
                        {value && details ? (
                            <>
                                <span className={homeStyles.homeFieldCode}>{details.code}</span>
                                <span className={homeStyles.homeFieldSub}>{details.city}, {details.country}</span>
                            </>
                        ) : (
                            <span className={homeStyles.homeFieldPlaceholder}>Select airport</span>
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
                <Popover.Dropdown className={styles.customDropdown}>
                    <div className={styles.searchWrapper}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search airports..."
                            value={searchQuery}
                            onChange={searchchange}
                            ref={searchInputRef}
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

    // Desktop popover view
    if (isListing) {
        return (
            <Popover
                opened={dropdownOpen}
                onChange={handlePopoverChange}
                position="bottom-start"
                width="target"
                shadow="md"
                offset={8}
                clickOutsideEvents={["mouseup", "touchend"]}
                middlewares={{ flip: false, shift: false }}
            >
                <Popover.Target>
                    <div
                        className={`${listingStyles.listingField} ${type === 'from' ? listingStyles.fromField : ''}`}
                        onClick={handleDropdownOpen}
                    >
                        <div className={`${listingStyles.fieldIcon} ${listingStyles.iconBlue}`}><FaMapMarkerAlt /></div>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>{type === 'from' ? 'FROM' : 'TO'}</span>
                            <div className={listingStyles.fieldValue} style={{ position: 'relative', paddingRight: value ? '22px' : 0 }}>
                                <span className={!value ? listingStyles.fieldValuePlaceholder : ''}>
                                    {value ? getAirportLabel(value) : 'Select airport'}
                                </span>
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
                <Popover.Dropdown className={styles.customDropdown}>
                    <div className={styles.searchWrapper}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search airports..."
                            value={searchQuery}
                            onChange={searchchange}
                            ref={searchInputRef}
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

    return (
        <Popover
            opened={dropdownOpen}
            onChange={handlePopoverChange}
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
                        id="floatingInput"
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
                    <label style={{ paddingLeft: '40px' }} htmlFor="floatingInput">{label}</label>
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
                        ref={searchInputRef}
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

export default function FlightSearch({ onSearch, variant = 'home' }) {
    const isListing = variant === 'listing';
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [popoverOpened, setPopoverOpened] = useState(false);
    const [breakPoint, setBreakPoint] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Mobile airport selector states
    const [mobileFromSelectorOpen, setMobileFromSelectorOpen] = useState(false);
    const [mobileToSelectorOpen, setMobileToSelectorOpen] = useState(false);

    // Airport dropdown states
    const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
    const [toDropdownOpen, setToDropdownOpen] = useState(false);
    const [fromSearchQuery, setFromSearchQuery] = useState('');
    const [toSearchQuery, setToSearchQuery] = useState('');

    // Multi-city dropdown states
    const [multiCityDropdowns, setMultiCityDropdowns] = useState({});
    const [multiCitySearchQueries, setMultiCitySearchQueries] = useState({});

    // Recent airports state
    const [recentFromAirports, setRecentFromAirports] = useState([]);
    const [recentToAirports, setRecentToAirports] = useState([]);

    const [formData, setFormData] = useState({
        flightType: "OneWay",
        from: "",
        to: "",
        departureDate: null,
        returnDate: null,
        dateRange: [null, null],
        adults: 1,
        children: 0,
        infants: 0,
        cabinClass: "Y",
        cabinClassTitle: "Economy",
    });

    const [multiCityFlights, setMultiCityFlights] = useState([
        { from: "", to: "", departureDate: null },
        { from: "", to: "", departureDate: null }
    ]);

    useEffect(() => {
        setBreakPoint(window.innerWidth <= 700);
        setIsMobile(window.innerWidth <= 768);

        // Load recent airports from localStorage
        const savedRecentFrom = localStorage.getItem('recentFromAirports');
        const savedRecentTo = localStorage.getItem('recentToAirports');
        if (savedRecentFrom) {
            setRecentFromAirports(JSON.parse(savedRecentFrom));
        }
        if (savedRecentTo) {
            setRecentToAirports(JSON.parse(savedRecentTo));
        }

        const handleResize = () => {
            setBreakPoint(window.innerWidth <= 700);
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);

        if (pathname === '/flights') {
            const DepartureCode = searchParams.get('DepartureCode');
            const ArrivalCode = searchParams.get('ArrivalCode');
            const DepartureDate = searchParams.get('DepartureDate');
            const adult = Number(searchParams.get('adult'));
            const child = Number(searchParams.get('child'));
            const infant = Number(searchParams.get('infant'));
            const CabinType = searchParams.get('CabinType');
            const AirTripType = searchParams.get('AirTripType');
            const depDate = DepartureDate ? new Date(DepartureDate) : null;
            const retDate = AirTripType === 'Return' && searchParams.get('ReturnDate') ? new Date(searchParams.get('ReturnDate')) : null;

            setFormData({
                flightType: AirTripType || "OneWay",
                from: DepartureCode || "",
                to: ArrivalCode || "",
                departureDate: AirTripType === 'Return' ? depDate : (AirTripType === 'OneWay' ? depDate : null),
                returnDate: AirTripType === 'Return' ? retDate : null,
                dateRange: AirTripType === 'Return' ? [depDate, retDate] : [null, null],
                adults: adult || 1,
                children: child || 0,
                infants: infant || 0,
                cabinClass: CabinType && CabinType !== 'All' ? CabinType : "Y",
                cabinClassTitle:
                    CabinType === 'C' ? 'Business'
                    : CabinType === 'F' ? 'First'
                    : CabinType === 'S' ? 'Premium Economy'
                    : 'Economy',
            });

            // Handle multi-city data from URL
            if (AirTripType === 'MultiCity') {
                const legs = [];
                let index = 1;
                while (searchParams.get(`flight${index}_from`)) {
                    legs.push({
                        from: searchParams.get(`flight${index}_from`),
                        to: searchParams.get(`flight${index}_to`),
                        departureDate: searchParams.get(`flight${index}_date`) ? new Date(searchParams.get(`flight${index}_date`)) : null
                    });
                    index++;
                }
                if (legs.length > 0) {
                    setMultiCityFlights(legs);
                }
            }
        }

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    const router = useRouter();
    const cabinClassOptions = [
        { title: "Economy", value: "Y" },
        { title: "Business", value: "C" },
        { title: "First", value: "F" },
        { title: "Premium Economy", value: "S" }
    ];

    const passengersShortLabel = `${String(formData.adults + formData.children + formData.infants).padStart(2, '0')} Passengers`;

    // Add airport to recent list
    const addToRecentAirports = (airportCode, type) => {
        if (!airportCode) return;

        const isFromType = type === 'from';
        const recentList = isFromType ? recentFromAirports : recentToAirports;
        const setRecentList = isFromType ? setRecentFromAirports : setRecentToAirports;
        const storageKey = isFromType ? 'recentFromAirports' : 'recentToAirports';

        // Remove if already exists
        const filteredList = recentList.filter(code => code !== airportCode);
        // Add to beginning
        const newList = [airportCode, ...filteredList].slice(0, 2);

        setRecentList(newList);
        localStorage.setItem(storageKey, JSON.stringify(newList));
    };


    const airportDropdownSharedProps = {
        isMobile,
        isListing,
        recentFromAirports,
        recentToAirports,
        addToRecentAirports,
    };

    const handleChange = (field, value) => {
        if (field === "cabinClass") {
            const selectedOption = cabinClassOptions.find(option => option.title === value);
            if (selectedOption) {
                setFormData((prev) => ({
                    ...prev,
                    cabinClass: selectedOption.value,
                    cabinClassTitle: value,
                }));
            }
        } else if (field === "flightType") {
            setFormData((prev) => {
                if (value === "OneWay") {
                    return { ...prev, flightType: value, returnDate: null, dateRange: [null, null] };
                }
                if (value === "Return") {
                    return {
                        ...prev,
                        flightType: value,
                        dateRange: [prev.departureDate, prev.returnDate],
                    };
                }
                return { ...prev, flightType: value };
            });
        } else if (field === "departureDate") {
            setFormData((prev) => {
                const next = {
                    ...prev,
                    departureDate: value,
                    dateRange: prev.flightType === "Return" ? [value, prev.returnDate] : prev.dateRange,
                };
                if (prev.flightType === "Return" && prev.returnDate && value && new Date(prev.returnDate) < new Date(value)) {
                    next.returnDate = null;
                    next.dateRange = [value, null];
                }
                return next;
            });
        } else if (field === "returnDate") {
            setFormData((prev) => ({
                ...prev,
                returnDate: value,
                dateRange: [prev.departureDate, value],
            }));
        } else if (field === "dateRange") {
            setFormData((prev) => ({
                ...prev,
                dateRange: value,
                departureDate: value?.[0] ?? null,
                returnDate: value?.[1] ?? null,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
        }

    };

    const handleCountChange = (type, increment = true) => {
        setFormData((prev) => {
            let newValue;
            if (type === 'adults') {
                newValue = increment ? prev.adults + 1 : Math.max(1, prev.adults - 1);
            } else {
                newValue = increment ? prev[type] + 1 : Math.max(0, prev[type] - 1);
            }
            return { ...prev, [type]: newValue };
        });
    };

    // Multi-city helpers
    const dayAfter = (date) => {
        if (!date) return new Date();
        const next = new Date(date);
        next.setHours(0, 0, 0, 0);
        next.setDate(next.getDate() + 1);
        return next;
    };

    const getMultiCityMinDate = (index) => {
        if (index <= 0) return new Date();
        const prevDate = multiCityFlights[index - 1]?.departureDate;
        return prevDate ? dayAfter(prevDate) : new Date();
    };

    // Multi-city handlers
    const handleMultiCityChange = (index, field, value) => {
        setMultiCityFlights((prev) => {
            const updated = prev.map((flight) => ({ ...flight }));
            updated[index] = { ...updated[index], [field]: value };

            // Arrival of flight N → auto-fill departure of flight N+1 (still editable)
            if (field === "to" && index < updated.length - 1) {
                if (value) {
                    updated[index + 1] = {
                        ...updated[index + 1],
                        from: value,
                        // Avoid same from/to on the next leg
                        to: updated[index + 1].to === value ? "" : updated[index + 1].to,
                    };
                }
            }

            // If a date moves forward/back, clear later legs that are no longer after previous
            if (field === "departureDate") {
                for (let i = index + 1; i < updated.length; i++) {
                    const prevDate = updated[i - 1]?.departureDate;
                    const currDate = updated[i]?.departureDate;
                    if (
                        prevDate &&
                        currDate &&
                        !moment(currDate).isAfter(moment(prevDate), "day")
                    ) {
                        updated[i] = { ...updated[i], departureDate: null };
                    }
                }
            }

            return updated;
        });
    };

    const addMultiCityFlight = () => {
        if (multiCityFlights.length < 5) {
            const lastFlight = multiCityFlights[multiCityFlights.length - 1];
            setMultiCityFlights([
                ...multiCityFlights,
                {
                    from: lastFlight?.to || "",
                    to: "",
                    departureDate: null,
                },
            ]);
        } else {
            notifications.show({
                title: 'Limit Reached',
                message: 'Maximum 5 flights allowed.',
                autoClose: 2000,
                color: 'orange'
            });
        }
    };

    const removeMultiCityFlight = (index) => {
        if (multiCityFlights.length > 2) {
            const updatedFlights = multiCityFlights.filter((_, i) => i !== index);
            setMultiCityFlights(updatedFlights);
        }
    };

    // Swap function for regular flights
    const handleSwap = () => {
        setFormData((prev) => ({
            ...prev,
            from: prev.to,
            to: prev.from,
        }));
    };

    // Swap function for multi-city flights
    const handleMultiCitySwap = (index) => {
        setMultiCityFlights((prev) => {
            const updated = prev.map((flight) => ({ ...flight }));
            const temp = updated[index].from;
            updated[index] = {
                ...updated[index],
                from: updated[index].to,
                to: temp,
            };
            // Keep next leg departure in sync with this leg's new arrival
            if (index < updated.length - 1 && updated[index].to) {
                updated[index + 1] = {
                    ...updated[index + 1],
                    from: updated[index].to,
                    to: updated[index + 1].to === updated[index].to ? "" : updated[index + 1].to,
                };
            }
            return updated;
        });
    };

    // Validation logic
    const validateForm = () => {
        if (formData.flightType === "MultiCity") {
            // Validate multi-city flights
            for (let i = 0; i < multiCityFlights.length; i++) {
                const flight = multiCityFlights[i];
                if (!flight.from) {
                    notifications.show({
                        title: 'Error',
                        message: `Please select departure airport for Flight ${i + 1}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
                if (!flight.to) {
                    notifications.show({
                        title: 'Error',
                        message: `Please select destination airport for Flight ${i + 1}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
                if (flight.from === flight.to) {
                    notifications.show({
                        title: 'Error',
                        message: `Departure and destination airports cannot be the same for Flight ${i + 1}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
                if (!flight.departureDate) {
                    notifications.show({
                        title: 'Error',
                        message: `Please select departure date for Flight ${i + 1}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
                if (i > 0) {
                    const prevDate = multiCityFlights[i - 1]?.departureDate;
                    if (
                        prevDate &&
                        !moment(flight.departureDate).isAfter(moment(prevDate), 'day')
                    ) {
                        notifications.show({
                            title: 'Error',
                            message: `Flight ${i + 1} date must be after Flight ${i} date.`,
                            autoClose: 2500,
                            color: 'red'
                        });
                        return false;
                    }
                }
            }
        } else {
            // Original validation for one-way and return
            if (!formData.from) {
                notifications.show({
                    title: 'Error',
                    message: 'Please select departure airport.',
                    autoClose: 2000,
                    color: 'red'
                });
                return false;
            }
            if (!formData.to) {
                notifications.show({
                    title: 'Error',
                    message: 'Please select destination airport.',
                    autoClose: 2000,
                    color: 'red'
                });
                return false;
            }
            if (formData.from === formData.to) {
                notifications.show({
                    title: 'Error',
                    message: 'Departure and destination airports cannot be the same.',
                    autoClose: 2000,
                    color: 'red'
                });
                return false;
            }
            if (formData.flightType === "OneWay") {
                if (!formData.departureDate) {
                    notifications.show({
                        title: 'Error',
                        message: 'Please select departure date.',
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
            } else if (formData.flightType === "Return") {
                if (!formData.departureDate || !formData.returnDate) {
                    notifications.show({
                        title: 'Error',
                        message: 'Please select both departure and return dates.',
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
            }
        }

        if (formData.adults < 1) {
            notifications.show({
                title: 'Error',
                message: 'At least one adult required.',
                autoClose: 2000,
                color: 'red'
            });
            return false;
        }
        return true;
    };
    // Handle search button click
    const handleSearch = () => {
        if (validateForm()) {
            if (formData.flightType === "MultiCity") {
                // Build multi-city search params
                const params = new URLSearchParams({
                    adult: formData.adults,
                    child: formData.children,
                    infant: formData.infants,
                    CabinType: formData.cabinClass,
                    AirTripType: formData.flightType,
                });

                // Add each flight segment
                multiCityFlights.forEach((flight, index) => {
                    params.append(`flight${index + 1}_from`, flight.from);
                    params.append(`flight${index + 1}_to`, flight.to);
                    params.append(`flight${index + 1}_date`, moment(flight.departureDate).format("YYYY-MM-DD"));
                });

                if (onSearch) onSearch();
                router.push(`/flights?${params.toString()}`);
            } else {
                const depDate = moment(
                    formData.flightType === "OneWay" ? formData.departureDate : formData.departureDate
                ).format("YYYY-MM-DD");

                const retDate = formData.flightType === "Return" && formData.returnDate
                    ? moment(formData.returnDate).format("YYYY-MM-DD")
                    : '';

                const params = new URLSearchParams({
                    DepartureCode: formData.from,
                    ArrivalCode: formData.to,
                    DepartureDate: depDate,
                    ReturnDate: retDate,
                    adult: formData.adults,
                    child: formData.children,
                    infant: formData.infants,
                    CabinType: formData.cabinClass,
                    AirTripType: formData.flightType,
                });
                if (onSearch) onSearch();
                router.push(`/flights?${params.toString()}`);
            }
        }
    };

    const travelersPopoverContent = (
        <div className="p-2">
            <div>
                <div className="e484bb5b7a mt-2">
                    <div className="c5aae0350e">
                        <label className="small">Adults</label>
                    </div>
                    <div className="e301a14002">
                        <div className="e301a14002">
                            <button onClick={() => handleCountChange('adults', false)} className="adult-modal-btn"><FaMinus /></button>
                            <span className="mx-2" aria-hidden="true">{formData.adults}</span>
                            <button onClick={() => handleCountChange('adults', true)} className="adult-modal-btn"><FaPlus /></button>
                        </div>
                    </div>
                </div>
                <div className="e484bb5b7a mt-2">
                    <div className="c5aae0350e">
                        <label className="small">Children</label>
                    </div>
                    <div className="e301a14002">
                        <div className="e301a14002">
                            <button onClick={() => handleCountChange('children', false)} className="adult-modal-btn"><FaMinus /></button>
                            <span className="mx-2" aria-hidden="true">{formData.children}</span>
                            <button onClick={() => handleCountChange('children', true)} className="adult-modal-btn"><FaPlus /></button>
                        </div>
                    </div>
                </div>
                <div className="e484bb5b7a mt-2">
                    <div className="c5aae0350e">
                        <label className="small">Infant</label>
                    </div>
                    <div className="e301a14002">
                        <div className="e301a14002">
                            <button onClick={() => handleCountChange('infants', false)} className="adult-modal-btn"><FaMinus /></button>
                            <span className="mx-2" aria-hidden="true">{formData.infants}</span>
                            <button onClick={() => handleCountChange('infants', true)} className="adult-modal-btn"><FaPlus /></button>
                        </div>
                    </div>
                </div>
                <hr />
                <p className="fw-bold small">Cabin Class</p>
                <select onChange={(e) => handleChange("cabinClass", e.target.value)} value={formData.cabinClassTitle} className="height-25 form-select">
                    {cabinClassOptions.map(option => (
                        <option key={option.value} value={option.title}>{option.title}</option>
                    ))}
                </select>
            </div>
            <button onClick={() => setPopoverOpened(false)} type="button" className={listingStyles.doneBtn}>Done</button>
        </div>
    );

    const travelersLabel = `${formData.adults + formData.children + formData.infants} traveler${formData.adults + formData.children + formData.infants !== 1 ? 's' : ''}, ${formData.cabinClassTitle}`;

    const renderListingTravelers = () => (
        <Popover
            width={300}
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom"
            withArrow
            shadow="md"
            clickOutsideEvents={["mouseup", "touchend"]}
        >
            <Popover.Target>
                <div className={listingStyles.listingField} onClick={() => setPopoverOpened((o) => !o)}>
                    <div className={listingStyles.fieldIcon}><IoMdPerson /></div>
                    <div className={listingStyles.fieldBody}>
                        <span className={listingStyles.fieldLabel}>PASSENGERS & CLASS</span>
                        <button type="button" className={listingStyles.travelersBtn}>{travelersLabel}</button>
                    </div>
                </div>
            </Popover.Target>
            <Popover.Dropdown>{travelersPopoverContent}</Popover.Dropdown>
        </Popover>
    );

    const shiftHomeDate = (field, days) => {
        const current = field === 'departure' ? formData.departureDate : formData.returnDate;
        const base = current ? new Date(current) : new Date();
        base.setHours(0, 0, 0, 0);
        base.setDate(base.getDate() + days);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (base < today) return;

        if (field === 'return' && formData.departureDate) {
            const dep = new Date(formData.departureDate);
            dep.setHours(0, 0, 0, 0);
            if (base < dep) return;
        }

        handleChange(field === 'departure' ? 'departureDate' : 'returnDate', base);
    };

    const renderHomeDateField = (variant) => {
        const isDeparture = variant === 'departure';
        const label = isDeparture ? 'Departure' : 'Return';
        const value = isDeparture ? formData.departureDate : formData.returnDate;
        const minDate = isDeparture
            ? new Date()
            : (formData.departureDate ? formData.departureDate : new Date());

        return (
            <div className={homeStyles.dateField}>
                <div className={homeStyles.dateFieldHeader}>
                    <FaCalendarAlt />
                    <span>{label}</span>
                </div>
                <div className={homeStyles.dateFieldValue}>
                    <DateInput
                        variant="unstyled"
                        placeholder="Select date"
                        valueFormat="MMM DD, ddd"
                        value={value}
                        onFocus={(e) => e.target.select()}
                        onChange={(date) => handleChange(isDeparture ? 'departureDate' : 'returnDate', date)}
                        minDate={minDate}
                    />
                </div>
                <div className={homeStyles.dateNav}>
                    <button
                        type="button"
                        className={homeStyles.dateNavBtn}
                        onClick={() => shiftHomeDate(variant, -1)}
                        disabled={!value}
                    >
                        &lt; Prev
                    </button>
                    <button
                        type="button"
                        className={homeStyles.dateNavBtn}
                        onClick={() => shiftHomeDate(variant, 1)}
                    >
                        Next &gt;
                    </button>
                </div>
            </div>
        );
    };

    const renderHomeTravelers = () => (
        <Popover
            width={300}
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-start"
            withArrow
            shadow="md"
            clickOutsideEvents={["mouseup", "touchend"]}
        >
            <Popover.Target>
                <button
                    type="button"
                    className={homeStyles.passengersTrigger}
                    onClick={() => setPopoverOpened((o) => !o)}
                >
                    {passengersShortLabel}
                </button>
            </Popover.Target>
            <Popover.Dropdown>{travelersPopoverContent}</Popover.Dropdown>
        </Popover>
    );

    const renderHomeFilters = () => (
        <div className={homeStyles.filtersRow}>
            <Select
                className={homeStyles.filterPill}
                value={formData.flightType}
                onChange={(value) => handleChange("flightType", value)}
                data={[
                    { value: "Return", label: "Round trip" },
                    { value: "OneWay", label: "One way" },
                    { value: "MultiCity", label: "Multi city" },
                ]}
                aria-label="Trip type"
            />
            {renderHomeTravelers()}
            <Select
                className={homeStyles.filterPill}
                value={formData.cabinClassTitle}
                onChange={(value) => handleChange("cabinClass", value)}
                data={cabinClassOptions.map((option) => ({
                    value: option.title,
                    label: option.title,
                }))}
                aria-label="Cabin class"
            />
        </div>
    );

    const renderListingDateField = () => (
        <div className={listingStyles.listingField}>
            <div className={listingStyles.fieldIcon}><FaCalendarAlt /></div>
            <div className={listingStyles.fieldBody}>
                <span className={listingStyles.fieldLabel}>
                    {formData.flightType === "OneWay" ? "DEPART" : "DEPART — RETURN"}
                </span>
                <div className={listingStyles.fieldValue}>
                    {formData.flightType === "OneWay" ? (
                        <DateInput
                            variant="unstyled"
                            placeholder="Select date"
                            valueFormat="DD MMM YYYY"
                            value={formData.departureDate}
                            onFocus={(e) => e.target.select()}
                            onChange={(date) => handleChange("departureDate", date)}
                            minDate={new Date()}
                        />
                    ) : (
                        <DatePickerInput
                            variant="unstyled"
                            placeholder="Select dates"
                            valueFormat="DD MMM YYYY"
                            value={formData.dateRange}
                            onChange={(dates) => handleChange("dateRange", dates)}
                            minDate={new Date()}
                            numberOfColumns={breakPoint ? 1 : 2}
                            type="range"
                        />
                    )}
                </div>
            </div>
        </div>
    );

    const renderListingToggle = () => (
        <div className={listingStyles.toggleGroup}>
            <div
                onClick={() => handleChange("flightType", "OneWay")}
                className={`${listingStyles.toggleItem} ${formData.flightType === 'OneWay' ? listingStyles.toggleActive : ''}`}
            >
                One-Way
            </div>
            <div
                onClick={() => handleChange("flightType", "Return")}
                className={`${listingStyles.toggleItem} ${formData.flightType === 'Return' ? listingStyles.toggleActive : ''}`}
            >
                Return
            </div>
            <div
                onClick={() => handleChange("flightType", "MultiCity")}
                className={`${listingStyles.toggleItem} ${formData.flightType === 'MultiCity' ? listingStyles.toggleActive : ''}`}
            >
                Multi-City
            </div>
        </div>
    );

    if (isListing) {
        if (formData.flightType === "MultiCity") {
            return (
                <div className={listingStyles.wrapper}>
                    {/* <button type="button" className={listingStyles.backRow} onClick={() => router.back()}>
                        <span>&#8249;</span> Back
                    </button> */}
                    <div className={listingStyles.searchRow}>
                        {renderListingToggle()}
                    </div>
                    <div className={listingStyles.multiCityCard}>
                        {multiCityFlights.map((flight, index) => (
                            <div key={index} className={listingStyles.multiCityLeg}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="small fw-bold text-muted">Flight {index + 1}</span>
                                    {multiCityFlights.length > 2 && (
                                        <button type="button" className={listingStyles.removeBtn} onClick={() => removeMultiCityFlight(index)}>
                                            <FaTimes /> Remove
                                        </button>
                                    )}
                                </div>
                                <div className={listingStyles.multiCityRow}>
                                    <div style={{ position: 'relative' }}>
                                        <AirportDropdown {...airportDropdownSharedProps}
                                            value={flight.from}
                                            onChange={(value) => handleMultiCityChange(index, "from", value)}
                                            placeholder="Search airport..."
                                            label="From?"
                                            type="from"
                                            dropdownOpen={multiCityDropdowns[`${index}-from`] || false}
                                            setDropdownOpen={(open) => setMultiCityDropdowns(prev => ({ ...prev, [`${index}-from`]: open }))}
                                            searchQuery={multiCitySearchQueries[`${index}-from`] || ''}
                                            setSearchQuery={(query) => setMultiCitySearchQueries(prev => ({ ...prev, [`${index}-from`]: query }))}
                                        />
                                        <div className={listingStyles.swapBtn} onClick={() => handleMultiCitySwap(index)} style={{ cursor: 'pointer' }}>
                                            <IoIosSwap />
                                        </div>
                                    </div>
                                    <AirportDropdown {...airportDropdownSharedProps}
                                        value={flight.to}
                                        onChange={(value) => handleMultiCityChange(index, "to", value)}
                                        excludeCode={flight.from}
                                        placeholder="Search airport..."
                                        label="To?"
                                        type="to"
                                        dropdownOpen={multiCityDropdowns[`${index}-to`] || false}
                                        setDropdownOpen={(open) => setMultiCityDropdowns(prev => ({ ...prev, [`${index}-to`]: open }))}
                                        searchQuery={multiCitySearchQueries[`${index}-to`] || ''}
                                        setSearchQuery={(query) => setMultiCitySearchQueries(prev => ({ ...prev, [`${index}-to`]: query }))}
                                    />
                                    <div className={listingStyles.listingField}>
                                        <div className={listingStyles.fieldIcon}><FaCalendarAlt /></div>
                                        <div className={listingStyles.fieldBody}>
                                            <span className={listingStyles.fieldLabel}>DATE</span>
                                            <div className={listingStyles.fieldValue}>
                                                <DateInput
                                                    variant="unstyled"
                                                    placeholder="Select date"
                                                    valueFormat="DD MMM YYYY"
                                                    value={flight.departureDate}
                                                    onFocus={(e) => e.target.select()}
                                                    minDate={getMultiCityMinDate(index)}
                                                    onChange={(date) => handleMultiCityChange(index, "departureDate", date)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className={listingStyles.multiCityActions}>
                            <button
                                type="button"
                                className={listingStyles.addFlightBtn}
                                onClick={addMultiCityFlight}
                                disabled={multiCityFlights.length >= 5}
                            >
                                <FaPlus /> Add Another Flight
                            </button>
                            <button className={listingStyles.searchBtn} onClick={handleSearch} type="button">
                                <FaSearch /> Search
                            </button>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            {renderListingTravelers()}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={listingStyles.wrapper}>
                {/* <button type="button" className={listingStyles.backRow} onClick={() => router.back()}>
                    <span>&#8249;</span> Back
                </button> */}
                <div className={listingStyles.searchRow}>
                    <div className={listingStyles.toggleGroup}>
                        <div
                            onClick={() => handleChange("flightType", "OneWay")}
                            className={`${listingStyles.toggleItem} ${formData.flightType === 'OneWay' ? listingStyles.toggleActive : ''}`}
                        >
                            One Way
                        </div>
                        <div
                            onClick={() => handleChange("flightType", "Return")}
                            className={`${listingStyles.toggleItem} ${formData.flightType === 'Return' ? listingStyles.toggleActive : ''}`}
                        >
                            Return
                        </div>
                        <div
                            onClick={() => handleChange("flightType", "MultiCity")}
                            className={`${listingStyles.toggleItem} ${formData.flightType === 'MultiCity' ? listingStyles.toggleActive : ''}`}
                        >
                            Multi-City
                        </div>
                    </div>
                    <div className={listingStyles.searchInputRow}>
                        <div className={listingStyles.fieldsCard}>
                            <div className={listingStyles.fieldsRow}>
                                <div style={{ position: 'relative', flex: 1, display: 'flex', minWidth: 0 }}>
                                    <AirportDropdown {...airportDropdownSharedProps}
                                        value={formData.from}
                                        onChange={(value) => handleChange("from", value)}
                                        placeholder="Search airport..."
                                        label="Leaving From?"
                                        type="from"
                                        dropdownOpen={fromDropdownOpen}
                                        setDropdownOpen={setFromDropdownOpen}
                                        searchQuery={fromSearchQuery}
                                        setSearchQuery={setFromSearchQuery}
                                    />
                                    <div className={listingStyles.swapBtn} onClick={handleSwap} style={{ cursor: 'pointer' }}>
                                        <IoIosSwap />
                                    </div>
                                </div>
                                <AirportDropdown {...airportDropdownSharedProps}
                                    value={formData.to}
                                    onChange={(value) => handleChange("to", value)}
                                    excludeCode={formData.from}
                                    placeholder="Search airport..."
                                    label="Going To?"
                                    type="to"
                                    dropdownOpen={toDropdownOpen}
                                    setDropdownOpen={setToDropdownOpen}
                                    searchQuery={toSearchQuery}
                                    setSearchQuery={setToSearchQuery}
                                />
                                {renderListingDateField()}
                                {renderListingTravelers()}
                            </div>
                        </div>
                        <button className={listingStyles.searchBtn} onClick={handleSearch} type="button">
                            <FaSearch /> Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={homeStyles.wrapper}>
            {formData.flightType === "MultiCity" ? (
                <div className={homeStyles.multiCitySection}>
                    {renderHomeFilters()}
                    {multiCityFlights.map((flight, index) => (
                        <div key={index} className="mb-3 position-relative">
                            <div className="d-flex justify-content-end align-items-center mb-2">
                                {multiCityFlights.length > 2 && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => removeMultiCityFlight(index)}
                                    >
                                        <FaTimes /> Remove
                                    </button>
                                )}
                            </div>
                            <div className="row gy-2 gx-lg-2 gx-3">
                                <div className="col-lg-4 col-md-6 position-relative">
                                    <div className="d-flex align-items-center position-relative">
                                        {/* <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                                            <FaMapMarkerAlt size={20} />
                                        </div> */}
                                        <AirportDropdown {...airportDropdownSharedProps}
                                            value={flight.from}
                                            onChange={(value) => handleMultiCityChange(index, "from", value)}
                                            placeholder="Search airport..."
                                            label="From?"
                                            type="from"
                                            dropdownOpen={multiCityDropdowns[`${index}-from`] || false}
                                            setDropdownOpen={(open) => setMultiCityDropdowns(prev => ({ ...prev, [`${index}-from`]: open }))}
                                            searchQuery={multiCitySearchQueries[`${index}-from`] || ''}
                                            setSearchQuery={(query) => setMultiCitySearchQueries(prev => ({ ...prev, [`${index}-from`]: query }))}
                                        />
                                    </div>
                                    <div className="flight-swap-btn" onClick={() => handleMultiCitySwap(index)} style={{ cursor: 'pointer' }}>
                                        <IoIosSwap />
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6">
                                    <div className="d-flex align-items-center position-relative">
                                        {/* <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                                            <FaMapMarkerAlt size={20} />
                                        </div> */}
                                        <AirportDropdown {...airportDropdownSharedProps}
                                            value={flight.to}
                                            onChange={(value) => handleMultiCityChange(index, "to", value)}
                                            excludeCode={flight.from}
                                            placeholder="Search airport..."
                                            label="To?"
                                            type="to"
                                            dropdownOpen={multiCityDropdowns[`${index}-to`] || false}
                                            setDropdownOpen={(open) => setMultiCityDropdowns(prev => ({ ...prev, [`${index}-to`]: open }))}
                                            searchQuery={multiCitySearchQueries[`${index}-to`] || ''}
                                            setSearchQuery={(query) => setMultiCitySearchQueries(prev => ({ ...prev, [`${index}-to`]: query }))}
                                        />
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6">
                                    <div className={homeStyles.dateField}>
                                        <div className={homeStyles.dateFieldHeader}>
                                            <FaCalendarAlt />
                                            <span>Date</span>
                                        </div>
                                        <div className={homeStyles.dateFieldValue}>
                                            <DateInput
                                                variant="unstyled"
                                                placeholder="Select date"
                                                valueFormat="MMM DD, ddd"
                                                value={flight.departureDate}
                                                onFocus={(e) => e.target.select()}
                                                minDate={getMultiCityMinDate(index)}
                                                onChange={(date) => handleMultiCityChange(index, "departureDate", date)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className={homeStyles.multiCityActions}>
                        <button
                            type="button"
                            className={homeStyles.addFlightBtn}
                            onClick={addMultiCityFlight}
                            disabled={multiCityFlights.length >= 5}
                        >
                            <FaPlus /> Add Another Flight
                        </button>
                        <button type="button" className={homeStyles.searchBtn} onClick={handleSearch} style={{ position: 'static', marginTop: 0 }}>
                            Search
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {renderHomeFilters()}
                    <div className={homeStyles.searchBar}>
                        <div className={homeStyles.fieldsRow}>
                            <div className={homeStyles.fromWrap}>
                                <AirportDropdown {...airportDropdownSharedProps}
                                    value={formData.from}
                                    onChange={(value) => handleChange("from", value)}
                                    placeholder="Search airport..."
                                    label="Leaving From?"
                                    type="from"
                                    dropdownVariant="home"
                                    dropdownOpen={fromDropdownOpen}
                                    setDropdownOpen={setFromDropdownOpen}
                                    searchQuery={fromSearchQuery}
                                    setSearchQuery={setFromSearchQuery}
                                />
                                <div className={homeStyles.fieldDivider} />
                                <AirportDropdown {...airportDropdownSharedProps}
                                    value={formData.to}
                                    onChange={(value) => handleChange("to", value)}
                                    excludeCode={formData.from}
                                    placeholder="Search airport..."
                                    label="Going To?"
                                    type="to"
                                    dropdownVariant="home"
                                    dropdownOpen={toDropdownOpen}
                                    setDropdownOpen={setToDropdownOpen}
                                    searchQuery={toSearchQuery}
                                    setSearchQuery={setToSearchQuery}
                                />
                                <button type="button" className={homeStyles.swapBtn} onClick={handleSwap} aria-label="Swap airports">
                                    <IoIosSwap />
                                </button>
                            </div>
                            <div className={homeStyles.fieldDivider} />
                            {renderHomeDateField('departure')}
                            {formData.flightType === "Return" && (
                                <>
                                    <div className={homeStyles.fieldDivider} />
                                    {renderHomeDateField('return')}
                                </>
                            )}
                        </div>
                        <button type="button" className={homeStyles.searchBtn} onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
