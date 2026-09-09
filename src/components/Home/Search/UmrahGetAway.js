'use client'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Select, Switch } from '@mantine/core'
import { Popover, SegmentedControl, TextInput, Box } from "@mantine/core";
import { DatePicker, MonthPicker } from "@mantine/dates";
import { FaCalendarAlt, FaMapMarkerAlt, FaMinus, FaMoon, FaPlus, FaUsers, FaTimes, FaPlane, FaCheck, FaSearch } from "react-icons/fa";
import { AirportList } from '@/util/AirportList';
import moment from 'moment';
import { useRouter, usePathname } from 'next/navigation';
import styles from './FlightSearch.module.css';
import homeStyles from './FlightSearchHome.module.css';
import listingStyles from './UmrahGetAwayListing.module.css';
import MobileAirportSelector from './MobileAirportSelector';
import { useDropdownScrollLock } from './useDropdownScrollLock';
export default function UmrahGetAway({ variant = 'home' }) {
    const isListing = variant === 'listing';
    const router = useRouter();
    const pathname = usePathname();
    const [breakPoint, setBreakPoint] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [airportDropdownOpen, setAirportDropdownOpen] = useState(false);
    const [airportSearchQuery, setAirportSearchQuery] = useState('');
    const [recentFromAirports, setRecentFromAirports] = useState([]);
    const [formData, setFormData] = useState({
        flightType: 'MakkahFirst',
        from: null,
        madinahNights: null,
        makkahNights: null,
        departureDate: null,
        dateMode: 'date',
        flexibility: null
    });
    const [errors, setErrors] = useState({});
    const [opened, setOpened] = useState(false);
    const [guestsPopover, setGuestsPopover] = useState(false);
    const [rooms, setRooms] = useState([
        { adults: 2, children: 0, childrenAges: [], errors: {} }
    ]);
    useEffect(() => {
        setBreakPoint(window.innerWidth <= 600);
        setIsMobile(window.innerWidth <= 768);

        // Load recent airports from localStorage
        const savedRecentFrom = localStorage.getItem('recentFromAirports');
        if (savedRecentFrom) {
            setRecentFromAirports(JSON.parse(savedRecentFrom));
        }

        const handleResize = () => {
            setBreakPoint(window.innerWidth <= 600);
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        if (localStorage.getItem('umrah_getaway_search') && pathname === '/umrah-getaway/search') {
            const searchList = JSON.parse(localStorage.getItem('umrah_getaway_search'));
            // console.log('searchList', searchList);
            setFormData({
                flightType: searchList?.journey_type === 'makkahFirst' ? 'MakkahFirst' : 'MadinahFirst',
                from: searchList?.departure_city || null,
                madinahNights: searchList?.madinah_nights ? String(searchList.madinah_nights) : null,
                makkahNights: searchList?.makkah_nights ? String(searchList.makkah_nights) : null,
                departureDate: searchList?.departure_date || null,
                dateMode: searchList?.dateType || 'date',
                flexibility: searchList?.flexibleDays || null
            });
            const storedrooms = searchList?.rooms.map(room => ({
                adults: room.adults,
                children: room.children,
                childrenAges: room.childrenAges,
                errors: {}
            }));
            setRooms(storedrooms);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [pathname])
    const nightsArray = useMemo(() =>
        Array.from({ length: 15 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1} ${i + 1 === 1 ? 'Night' : 'Nights'}`
        })), []
    );
    const airportOptions = useMemo(() =>
        AirportList.map(airport => ({
            value: airport.airportCode,
            label: `${airport.airportName} (${airport.airportCode}) - ${airport.countryName}`,
            searchable: `${airport.airportCode} ${airport.airportName} ${airport.cityName} ${airport.countryName}`
        })), []
    );

    // Handle form input changes
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user makes a change
        setErrors(prev => ({ ...prev, [field]: null }));
    };

    // Room Management Functions
    const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
    const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);
    const addRoom = () => {
        setRooms([...rooms, { adults: 2, children: 0, childrenAges: [], errors: {} }]);
    };
    const removeRoom = (index) => {
        if (rooms.length === 1) return;
        const updatedRooms = rooms.filter((_, i) => i !== index);
        setRooms(updatedRooms);
    };
    const handleRoomChange = (index, type, delta) => {
        const updatedRooms = [...rooms];

        if (type === "adults") {
            updatedRooms[index].adults = Math.max(
                1,
                updatedRooms[index].adults + delta
            );
        }
        else if (type === "children") {
            const prevCount = updatedRooms[index].children;
            const newCount = Math.max(0, prevCount + delta);

            updatedRooms[index].children = newCount;

            // copy old ages
            let ages = [...(updatedRooms[index].childrenAges || [])];

            if (newCount > prevCount) {
                // child add hua → sirf new entry null
                ages.push(null);
            } else if (newCount < prevCount) {
                // child remove hua → last age remove
                ages.pop();
            }

            updatedRooms[index].childrenAges = ages;

            // agar children 0 ho jaen to errors remove
            if (newCount === 0) {
                updatedRooms[index].errors = {};
            }
        }

        setRooms(updatedRooms);
    };
    const handleAgeChange = (roomIndex, ageIndex, value) => {
        const updatedRooms = [...rooms];
        updatedRooms[roomIndex].childrenAges[ageIndex] = value;
        const hasEmptyAge = updatedRooms[roomIndex].childrenAges.some((age) => !age);
        if (!hasEmptyAge) {
            updatedRooms[roomIndex].errors = {};
        }
        setRooms(updatedRooms);
    };
    const ClosePopover = () => {
        // ✅ Check children ages for each room
        const updatedRooms = rooms.map((room) => {
            const roomErrors = {};
            if (room.children > 0) {
                const hasEmptyAge = room.childrenAges.some((age) => !age);
                if (hasEmptyAge) {
                    roomErrors.childrenAges = "Please select age for all children";
                }
            }
            return { ...room, errors: roomErrors };
        });

        setRooms(updatedRooms);
        const hasRoomErrors = updatedRooms.some(
            (room) => Object.keys(room.errors).length > 0
        );
        if (hasRoomErrors) {
            return;
        }
        setGuestsPopover(false);
    };
    const validateForm = () => {
        const newErrors = {};

        // Check required fields
        if (!formData.from) {
            newErrors.from = "Please select departure airport";
        }
        if (!formData.madinahNights) {
            newErrors.madinahNights = "Please select Madinah nights";
        }
        if (!formData.makkahNights) {
            newErrors.makkahNights = "Please select Makkah nights";
        }
        if (!formData.departureDate) {
            newErrors.departureDate = "Please select departure date";
        }
        if (formData.dateMode === 'flexible' && !formData.flexibility) {
            newErrors.flexibility = "Please select flexibility option";
        }

        // Check room children ages
        const hasRoomErrors = rooms.some(room => {
            if (room.children > 0) {
                return room.childrenAges.some(age => !age);
            }
            return false;
        });

        if (hasRoomErrors) {
            alert("Please select age for all children in all rooms");
            return false;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }

        return true;
    };
    const SubmitForm = () => {
        if (!validateForm()) return;

        // Build search parameters
        const searchList = {
            journey_type: formData.flightType === 'MakkahFirst' ? 'makkahFirst' : 'madinahFirst',
            departure_city: formData.from,
            madinah_nights: formData.madinahNights,
            makkah_nights: formData.makkahNights,
            departure_date: formData.departureDate,
            dateType: formData.dateMode,
            flexibleDays: formData.flexibility,
            rooms: rooms.map(room => ({
                adults: room.adults,
                children: room.children,
                childrenAges: room.childrenAges
            }))
        };
        const queryParams = new URLSearchParams();
        queryParams.set('journey_type', formData.flightType === 'MakkahFirst' ? 'makkahFirst' : 'madinahFirst');
        queryParams.set('madinah_nights', formData.madinahNights);
        queryParams.set('makkah_nights', formData.makkahNights);
        queryParams.set('departure_city', formData.from);
        queryParams.set('departure_date', formData.departureDate);
        if (formData.dateMode === 'flexible') {
            queryParams.set('flexibleDays', formData.flexibility);
        }
        if (localStorage.getItem('umrah_getaway_search')) {
            localStorage.removeItem('umrah_getaway_search');
        }
        localStorage.setItem('umrah_getaway_search', JSON.stringify(searchList));
        router.push(`/umrah-getaway/search?${queryParams.toString()}`);
    };

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
                airports: airports.slice(0, 20)
            }))
            .slice(0, 10);

        return countriesArray;
    };

    // Get selected airport details
    const getAirportLabel = (code) => {
        const airport = AirportList.find(a => a.airportCode === code);
        return airport ? `${airport.cityName} (${airport.airportCode})` : '';
    };

    const getAirportDetails = (code) => {
        const airport = AirportList.find(a => a.airportCode === code);
        if (!airport) return null;
        return {
            code: airport.airportCode,
            city: (airport.cityName || '').toUpperCase(),
            country: (airport.countryName || '').toUpperCase(),
        };
    };

    const getHomeDateLabel = () => {
        if (!formData.departureDate) return '';
        const formatted = moment(formData.departureDate).format('MMM DD, ddd');
        if (formData.dateMode === 'flexible' && formData.flexibility) {
            return `${formatted} ±${formData.flexibility} Days`;
        }
        return formatted;
    };

    const getTravelersLabel = () => {
        const adults = `${totalAdults} Adult${totalAdults !== 1 ? 's' : ''}`;
        const roomsLabel = `${rooms.length} Room${rooms.length !== 1 ? 's' : ''}`;
        if (isListing) {
            return `${adults} · ${roomsLabel}`;
        }
        return `${adults}, ${totalChildren} ${totalChildren === 1 ? 'Child' : 'Children'}, ${roomsLabel}`;
    };

    const getDateLabel = () => {
        if (!formData.departureDate) return '';
        const formatted = moment(formData.departureDate).format(isListing ? 'DD MMM YYYY' : 'DD-MM-YYYY');
        if (formData.dateMode === 'flexible' && formData.flexibility) {
            return `${formatted} ±${formData.flexibility} Days`;
        }
        return formatted;
    };

    // Add airport to recent list
    const addToRecentAirports = (airportCode) => {
        if (!airportCode) return;

        // Remove if already exists
        const filteredList = recentFromAirports.filter(code => code !== airportCode);
        // Add to beginning
        const newList = [airportCode, ...filteredList].slice(0, 2);

        setRecentFromAirports(newList);
        localStorage.setItem('recentFromAirports', JSON.stringify(newList));
    };

    // Keep hooks at parent level — nested AirportDropdown remounted on every
    // keystroke and stole focus from the search input.
    const airportSearchInputRef = useRef(null);
    const { handleOpenClick, createOpenChangeHandler } = useDropdownScrollLock(
        airportDropdownOpen,
        airportSearchInputRef
    );
    const handleAirportPopoverChange = createOpenChangeHandler(setAirportDropdownOpen);

    const openAirportDropdown = (e) => {
        handleOpenClick(e, () => setAirportDropdownOpen(true));
    };

    const handleAirportSelect = (airportCode) => {
        handleChange('from', airportCode);
        addToRecentAirports(airportCode);
        setAirportDropdownOpen(false);
        setAirportSearchQuery('');
    };

    const handleAirportClear = (e) => {
        e.stopPropagation();
        handleChange('from', null);
        setAirportSearchQuery('');
    };

    const getAirportsToDisplay = () => {
        if (airportSearchQuery) {
            return filterAirports(AirportList, airportSearchQuery, formData.from);
        }
        if (recentFromAirports.length > 0) {
            const recentAirports = recentFromAirports
                .map(code => AirportList.find(a => a.airportCode === code))
                .filter(Boolean);

            if (recentAirports.length > 0) {
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
    };

    // Render helper (not a nested component) so typing does not remount the input
    const renderAirportDropdown = () => {
        const groupedAirports = getAirportsToDisplay();
        const totalAirports = groupedAirports.reduce((sum, group) => sum + group.airports.length, 0);
        const airportFieldClass = isListing ? listingStyles.listingField : '';

        const airportInput = (
            <>
                <input
                    type="text"
                    style={isListing ? { cursor: 'pointer', width: '100%', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.88rem', color: '#1B3B6F', padding: 0, outline: 'none' } : { paddingLeft: '40px', paddingRight: formData.from ? '40px' : '12px', cursor: 'pointer' }}
                    className={isListing ? '' : 'form-control hotel-date-range'}
                    placeholder={isListing ? 'Select airport' : ' '}
                    value={getAirportLabel(formData.from)}
                    onClick={openAirportDropdown}
                    readOnly
                />
                {formData.from && (
                    <button
                        className={isListing ? listingStyles.clearButton : styles.clearButton}
                        onClick={handleAirportClear}
                        type="button"
                        aria-label="Clear selection"
                    >
                        <FaTimes />
                    </button>
                )}
            </>
        );

        const airportListContent = (
            <>
                <div className={styles.searchWrapper}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search airports..."
                        value={airportSearchQuery}
                        onChange={(e) => setAirportSearchQuery(e.target.value)}
                        ref={airportSearchInputRef}
                    />
                </div>
                <div className={styles.airportList}>
                    {totalAirports > 0 ? (
                        groupedAirports.map((group, groupIndex) => (
                            <React.Fragment key={group.country}>
                                <div className={styles.countryHeader}>
                                    {!airportSearchQuery ? (groupIndex === 0 ? 'Recent Searches' : '') : group.country}
                                    {formData.from && group.airports.find(a => a.airportCode === formData.from) && (
                                        <span className={styles.selectedBadge}>Current</span>
                                    )}
                                </div>
                                {group.airports.map((airport) => (
                                    <div
                                        key={airport.airportCode}
                                        className={`${styles.airportOption} ${formData.from === airport.airportCode ? styles.selected : ''}`}
                                        onClick={() => handleAirportSelect(airport.airportCode)}
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
                                        {formData.from === airport.airportCode && (
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
                            {airportSearchQuery ? 'No airports found' : 'Start typing to search airports...'}
                        </div>
                    )}
                </div>
            </>
        );

        // Home hero card (all screen sizes)
        if (!isListing) {
            const details = getAirportDetails(formData.from);

            if (isMobile) {
                return (
                    <>
                        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                            <div className={homeStyles.homeField} onClick={openAirportDropdown}>
                                <span className={homeStyles.homeFieldLabel}>From Airport</span>
                                {formData.from && details ? (
                                    <>
                                        <span className={homeStyles.homeFieldCode}>{details.code}</span>
                                        <span className={homeStyles.homeFieldSub}>{details.city}, {details.country}</span>
                                    </>
                                ) : (
                                    <span className={homeStyles.homeFieldPlaceholder}>Select airport</span>
                                )}
                                {formData.from && (
                                    <button
                                        className={homeStyles.clearButton}
                                        onClick={handleAirportClear}
                                        type="button"
                                        aria-label="Clear selection"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </div>
                        <MobileAirportSelector
                            isOpen={airportDropdownOpen}
                            onClose={() => setAirportDropdownOpen(false)}
                            onSelect={handleAirportSelect}
                            selectedValue={formData.from}
                            label="From Airport?"
                            type="from"
                            recentAirports={recentFromAirports}
                        />
                    </>
                );
            }

            return (
                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                    <Popover
                        opened={airportDropdownOpen}
                        onChange={handleAirportPopoverChange}
                        position="bottom-start"
                        width="target"
                        shadow="md"
                        offset={8}
                        clickOutsideEvents={["mouseup", "touchend"]}
                        middlewares={{ flip: false, shift: false }}
                    >
                        <Popover.Target>
                            <div className={homeStyles.homeField} onClick={openAirportDropdown}>
                                <span className={homeStyles.homeFieldLabel}>From Airport</span>
                                {formData.from && details ? (
                                    <>
                                        <span className={homeStyles.homeFieldCode}>{details.code}</span>
                                        <span className={homeStyles.homeFieldSub}>{details.city}, {details.country}</span>
                                    </>
                                ) : (
                                    <span className={homeStyles.homeFieldPlaceholder}>Select airport</span>
                                )}
                                {formData.from && (
                                    <button
                                        className={homeStyles.clearButton}
                                        onClick={handleAirportClear}
                                        type="button"
                                        aria-label="Clear selection"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </Popover.Target>
                        <Popover.Dropdown className={styles.customDropdown}>
                            {airportListContent}
                        </Popover.Dropdown>
                    </Popover>
                </div>
            );
        }

        // Listing mobile view
        if (isMobile && isListing) {
            return (
                <>
                    <div className={airportFieldClass}>
                        <div className={`${listingStyles.fieldIcon} ${listingStyles.iconBlue}`}><FaMapMarkerAlt /></div>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>FROM AIRPORT</span>
                            <div className={listingStyles.fieldValue} style={{ position: 'relative' }}>
                                {airportInput}
                            </div>
                        </div>
                    </div>
                    <MobileAirportSelector
                        isOpen={airportDropdownOpen}
                        onClose={() => setAirportDropdownOpen(false)}
                        onSelect={handleAirportSelect}
                        selectedValue={formData.from}
                        label="From Airport?"
                        type="from"
                        recentAirports={recentFromAirports}
                    />
                </>
            );
        }

        // Desktop / listing view
        return (
            <Popover
                opened={airportDropdownOpen}
                onChange={handleAirportPopoverChange}
                position="bottom-start"
                width="target"
                shadow="md"
                offset={8}
                clickOutsideEvents={["mouseup", "touchend"]}
                middlewares={{ flip: false, shift: false }}
            >
                <Popover.Target>
                    {isListing ? (
                        <div className={`${airportFieldClass} cursor-pointer`} onClick={openAirportDropdown}>
                            <div className={`${listingStyles.fieldIcon} ${listingStyles.iconBlue}`}><FaMapMarkerAlt /></div>
                            <div className={listingStyles.fieldBody}>
                                <span className={listingStyles.fieldLabel}>FROM AIRPORT</span>
                                <div className={listingStyles.fieldValue} style={{ position: 'relative' }}>
                                    {airportInput}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="form-floating w-100 position-relative">
                            {airportInput}
                            <label style={{ paddingLeft: '40px' }} htmlFor="floatingInput">From Airport?</label>
                        </div>
                    )}
                </Popover.Target>
                <Popover.Dropdown className={styles.customDropdown}>
                    {airportListContent}
                </Popover.Dropdown>
            </Popover>
        );
    };

    const guestsPopoverContent = (
        <div className="p-2">
            {rooms.map((room, index) => (
                <div key={index} className="mt-2">
                    <div className="d-flex justify-content-between  align-items-center">
                        <p className="small m-0">Room {index + 1}</p>
                        {index + 1 !== 1 && (
                            <button onClick={() => removeRoom(index)} className="btn btn-danger x-small btn-sm">
                                Delete
                            </button>
                        )}
                    </div>
                    <hr className="m-1" />
                    <div className="e484bb5b7a mt-2">
                        <div className="c5aae0350e">
                            <label className="small " >Adults</label>
                        </div>
                        <div className="e301a14002">
                            <div className="e301a14002">
                                <button onClick={() => handleRoomChange(index, "adults", -1)} className="adult-modal-btn" ><FaMinus /></button>
                                <span className="mx-2" aria-hidden="true">{room.adults}</span>
                                <button onClick={() => handleRoomChange(index, "adults", 1)} className="adult-modal-btn" ><FaPlus /></button>
                            </div>
                        </div>
                    </div>
                    <div className="e484bb5b7a mt-2">
                        <div className="c5aae0350e">
                            <label className="small " >Children</label>
                        </div>
                        <div className="e301a14002">
                            <div className="e301a14002">
                                <button onClick={() => handleRoomChange(index, "children", -1)} className="adult-modal-btn" ><FaMinus /></button>
                                <span className="mx-2" aria-hidden="true">{room.children}</span>
                                <button onClick={() => handleRoomChange(index, "children", 1)} className="adult-modal-btn" ><FaPlus /></button>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex mt-2 flex-wrap justify-content-between">
                        {room.childrenAges.map((age, ageIndex) => (
                            <div key={ageIndex} className="kids-age-select">
                                <select onChange={(e) => handleAgeChange(index, ageIndex, e.target.value)}
                                    value={age} className="form-control border  form-control-sm">
                                    <option value="">Age Needed</option>
                                    {[...Array(16).keys()].map((n) => (
                                        <option key={n + 1} value={n + 1}>{n + 1}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    {room.errors.childrenAges && (
                        <p className="text-danger small mt-1">{room.errors.childrenAges}</p>
                    )}
                </div>
            ))}
            <hr />
            <p onClick={addRoom} className="small cursor-pointer text-end mb-1 text-primary">+ Add Room</p>
            <button onClick={ClosePopover} type="button" className={listingStyles.doneBtn}>Done</button>
        </div>
    );

    const datePopoverDropdown = (
        <Popover.Dropdown>
            <SegmentedControl
                fullWidth
                value={formData.dateMode}
                onChange={(mode) => handleChange("dateMode", mode)}
                data={[
                    { label: "Specific Date", value: "date" },
                    { label: "Flexible Dates", value: "flexible" },
                ]}
                mb="sm"
            />
            <Box>
                {formData.dateMode === "date" && (
                    <DatePicker
                        value={formData.departureDate}
                        onChange={(val) => {
                            handleChange("departureDate", val);
                            handleChange("flexibility", null);
                            setOpened(false);
                        }}
                        minDate={new Date()}
                    />
                )}
                {formData.dateMode === "flexible" && (
                    <>
                        <DatePicker
                            label="Preferred Date"
                            value={formData.departureDate}
                            onChange={(val) => {
                                handleChange("departureDate", val);
                                if (val && formData.flexibility) setOpened(false);
                            }}
                            minDate={new Date()}
                            mb="sm"
                        />
                        <SegmentedControl
                            fullWidth
                            value={formData.flexibility}
                            onChange={(val) => {
                                handleChange("flexibility", val);
                                if (formData.departureDate && val) setOpened(false);
                            }}
                            data={[
                                { label: "±3 Days", value: "3" },
                                { label: "±7 Days", value: "7" },
                                { label: "±10 Days", value: "10" },
                            ]}
                        />
                    </>
                )}
            </Box>
        </Popover.Dropdown>
    );

    const renderTravelersPopover = (listingField = false) => (
        <Popover
            width={300}
            opened={guestsPopover}
            onChange={setGuestsPopover}
            position="bottom-end"
            withArrow
            shadow="md"
            clickOutsideEvents={["mouseup", "touchend"]}
        >
            <Popover.Target>
                {listingField ? (
                    <div className={`${listingStyles.listingField} cursor-pointer`} onClick={() => setGuestsPopover((o) => !o)}>
                        <div className={`${listingStyles.fieldIcon} ${listingStyles.iconBlue}`}><FaUsers /></div>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>TRAVELERS</span>
                            <button type="button" className={listingStyles.travelersBtn}>{getTravelersLabel()}</button>
                        </div>
                    </div>
                ) : breakPoint ? (
                    <div className="d-flex align-items-center position-relative mt-3 mt-md-0">
                        <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                            <FaUsers size={20} />
                        </div>
                        <div className="form-floating w-100">
                            <button style={{ paddingLeft: '40px' }} id="floatingInput3" className="btn-sm text-start form-control" onClick={() => setGuestsPopover((o) => !o)}>
                                {getTravelersLabel()}
                            </button>
                            <label htmlFor="floatingInput3" style={{ paddingLeft: '40px' }}>Guests</label>
                        </div>
                    </div>
                ) : (
                    <button className="btn-sm form-control" onClick={() => setGuestsPopover((o) => !o)}>
                        {getTravelersLabel()}
                    </button>
                )}
            </Popover.Target>
            <Popover.Dropdown>{guestsPopoverContent}</Popover.Dropdown>
        </Popover>
    );

    const isMadinahFirst = formData.flightType === 'MadinahFirst';
    const firstNightLabel = isMadinahFirst ? 'MADINAH NIGHTS' : 'MAKKAH NIGHTS';
    const secondNightLabel = isMadinahFirst ? 'MAKKAH NIGHTS' : 'MADINAH NIGHTS';
    const firstNightValue = isMadinahFirst ? formData.madinahNights : formData.makkahNights;
    const secondNightValue = isMadinahFirst ? formData.makkahNights : formData.madinahNights;
    const firstNightKey = isMadinahFirst ? 'madinahNights' : 'makkahNights';
    const secondNightKey = isMadinahFirst ? 'makkahNights' : 'madinahNights';
    const firstNightError = isMadinahFirst ? errors.madinahNights : errors.makkahNights;
    const secondNightError = isMadinahFirst ? errors.makkahNights : errors.madinahNights;

    if (isListing) {
        const renderNightField = (label, value, fieldKey, error) => (
            <div className={listingStyles.listingField}>
                <div className={`${listingStyles.fieldIcon} ${listingStyles.iconGold}`}><FaMoon /></div>
                <div className={listingStyles.fieldBody}>
                    <span className={listingStyles.fieldLabel}>{label}</span>
                    <div className={listingStyles.fieldValue}>
                        <Select
                            variant='unstyled'
                            placeholder='Select nights'
                            classNames={{ input: listingStyles.selectInput }}
                            data={nightsArray}
                            value={value}
                            onChange={(val) => handleChange(fieldKey, val)}
                            searchable
                            error={!!error}
                        />
                    </div>
                </div>
            </div>
        );

        const renderDateField = () => (
            <Popover opened={opened} onChange={setOpened} position="bottom-start" width="auto">
                <Popover.Target>
                    <div className={`${listingStyles.listingField} cursor-pointer`} onClick={() => setOpened(true)}>
                        <div className={`${listingStyles.fieldIcon} ${listingStyles.iconBlue}`}><FaCalendarAlt /></div>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>DEPARTURE DATE</span>
                            <div className={listingStyles.fieldValue}>
                                <TextInput
                                    variant='unstyled'
                                    classNames={{ input: listingStyles.textInput }}
                                    value={getDateLabel()}
                                    placeholder="Select date"
                                    onClick={() => setOpened(true)}
                                    error={!!errors.departureDate || !!errors.flexibility}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </Popover.Target>
                {datePopoverDropdown}
            </Popover>
        );

        const toggleControls = (
            <>
                <div
                    onClick={() => handleChange("flightType", "MakkahFirst")}
                    className={`${listingStyles.toggleItem} ${formData.flightType === 'MakkahFirst' ? listingStyles.toggleActive : ''}`}
                >
                    Makkah First
                </div>
                <div
                    onClick={() => handleChange("flightType", "MadinahFirst")}
                    className={`${listingStyles.toggleItem} ${formData.flightType === 'MadinahFirst' ? listingStyles.toggleActive : ''}`}
                >
                    Madinah First
                </div>
            </>
        );

        return (
            <div className={listingStyles.wrapper}>
                {/* <button type="button" className={listingStyles.backRow} onClick={() => router.back()}>
                    <span>&#8249;</span> Back
                </button> */}
                <div className={listingStyles.searchRow}>
                    <div className={listingStyles.toggleGroup}>
                        {toggleControls}
                    </div>
                    <div className={listingStyles.fieldsRow}>
                        <div className={listingStyles.fieldsCard}>
                            <div className={listingStyles.fieldsRow}>
                                {renderNightField(firstNightLabel, firstNightValue, firstNightKey, firstNightError)}
                                {renderNightField(secondNightLabel, secondNightValue, secondNightKey, secondNightError)}
                                {renderAirportDropdown()}
                                {renderDateField()}
                                {renderTravelersPopover(true)}
                            </div>
                        </div>
                        <button onClick={SubmitForm} className={listingStyles.searchBtn} type="button">
                            <FaSearch /> Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={homeStyles.wrapper}>
            <div className={homeStyles.filtersRow}>
                <Select
                    className={homeStyles.filterPill}
                    value={formData.flightType}
                    onChange={(value) => handleChange("flightType", value)}
                    data={[
                        { value: "MakkahFirst", label: "Makkah first" },
                        { value: "MadinahFirst", label: "Madinah first" },
                    ]}
                    aria-label="Journey type"
                />
                <Popover
                    width={300}
                    opened={guestsPopover}
                    onChange={setGuestsPopover}
                    position="bottom-start"
                    withArrow
                    shadow="md"
                    clickOutsideEvents={["mouseup", "touchend"]}
                >
                    <Popover.Target>
                        <button
                            type="button"
                            className={homeStyles.passengersTrigger}
                            onClick={() => setGuestsPopover((o) => !o)}
                        >
                            {getTravelersLabel()}
                        </button>
                    </Popover.Target>
                    <Popover.Dropdown>{guestsPopoverContent}</Popover.Dropdown>
                </Popover>
            </div>
            <div className={homeStyles.searchBar}>
                <div className={homeStyles.fieldsRow}>
                    <div className={homeStyles.dateField}>
                        <div className={homeStyles.dateFieldHeader}>
                            <FaMoon />
                            <span>{isMadinahFirst ? 'Madinah Nights' : 'Makkah Nights'}</span>
                        </div>
                        <div className={homeStyles.dateFieldValue}>
                            <Select
                                variant="unstyled"
                                placeholder="Nights"
                                data={nightsArray}
                                value={firstNightValue}
                                onChange={(val) => handleChange(firstNightKey, val)}
                                searchable
                                error={!!firstNightError}
                            />
                        </div>
                    </div>
                    <div className={homeStyles.fieldDivider} />
                    <div className={homeStyles.dateField}>
                        <div className={homeStyles.dateFieldHeader}>
                            <FaMoon />
                            <span>{isMadinahFirst ? 'Makkah Nights' : 'Madinah Nights'}</span>
                        </div>
                        <div className={homeStyles.dateFieldValue}>
                            <Select
                                variant="unstyled"
                                placeholder="Nights"
                                data={nightsArray}
                                value={secondNightValue}
                                onChange={(val) => handleChange(secondNightKey, val)}
                                searchable
                                error={!!secondNightError}
                            />
                        </div>
                    </div>
                    <div className={homeStyles.fieldDivider} />
                    {renderAirportDropdown()}
                    <div className={homeStyles.fieldDivider} />
                    <Popover opened={opened} onChange={setOpened} position="bottom-start" width="auto">
                        <Popover.Target>
                            <div
                                className={homeStyles.dateField}
                                onClick={() => setOpened(true)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && setOpened(true)}
                            >
                                <div className={homeStyles.dateFieldHeader}>
                                    <FaCalendarAlt />
                                    <span>Departure Date</span>
                                </div>
                                <div className={homeStyles.dateFieldValue}>
                                    {getHomeDateLabel() ? (
                                        <span className={homeStyles.dateDisplayText}>{getHomeDateLabel()}</span>
                                    ) : (
                                        <span className={homeStyles.dateDisplayPlaceholder}>Select date</span>
                                    )}
                                </div>
                            </div>
                        </Popover.Target>
                        {datePopoverDropdown}
                    </Popover>
                </div>
                <button type="button" className={homeStyles.searchBtn} onClick={SubmitForm}>
                    Search
                </button>
            </div>
        </div>
    )
}