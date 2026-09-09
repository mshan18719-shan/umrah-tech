'use client'
import React, { useEffect, useState } from 'react';
import { Popover, Switch } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { AirportList } from "@/util/AirportList";
import { FaCalendarAlt, FaMapMarkerAlt, FaMinus, FaPlus, FaUsers } from 'react-icons/fa';
import { RiPlaneFill } from "react-icons/ri";
import moment from 'moment';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useHolidayPackageStore } from '@/components/Store/HolidayPackageStore';
import HotelLocationSelector from './HotelLocationSelector';
import GeneralAirportSelector from './GeneralAirportSelector';
import { IoMdPerson } from 'react-icons/io';
export default function GeneralPackages({ packageConfig, isActive, onSearch }) {
    const router = useRouter();
    const { initializePackage, getNextRoute, clearPackageData } = useHolidayPackageStore();

    const [popoverOpened, setPopoverOpened] = useState(false);
    const [breakPoint, setBreakPoint] = useState(false);
    const [selectedServices, setSelectedServices] = useState({
        stay: true,
        flight: true,
        car: false
    });
    const [placeApiLoader, setPlaceApiLoader] = useState(false);
    // Airport dropdown states
    const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
    const [toDropdownOpen, setToDropdownOpen] = useState(false);
    const [fromSearchQuery, setFromSearchQuery] = useState('');
    const [toSearchQuery, setToSearchQuery] = useState('');

    // Recent airports state
    const [recentFromAirports, setRecentFromAirports] = useState([]);
    const [recentToAirports, setRecentToAirports] = useState([]);

    const [FormData, setFormData] = useState({
        from: '',
        to: '',
        // Departure airport location details
        fromLocation: {
            lat: null,
            lng: null,
            city: '',
            country: '',
            countryCode: '',
            airportName: ''
        },
        // Arrival airport location details
        toLocation: {
            lat: null,
            lng: null,
            city: '',
            country: '',
            countryCode: '',
            airportName: ''
        },
        // Hotel location details
        location: '',
        lat: null,
        lng: null,
        city: '',
        code: '',
        country: '',
        cabinClass: 'Y',
        cabinClassName: 'economy',
        adults: 1,
        children: 0,
        infants: 0,
        dates: [moment().add(1, 'days').toDate(), moment().add(2, 'days').toDate()],
    })
    const [rooms, setRooms] = useState([
        { adults: 2, children: 0, childrenAges: [], errors: {} }
    ]);

    const addRoom = () => {
        setRooms([...rooms, { adults: 2, children: 0, childrenAges: [], errors: {} }]);
    };
    useEffect(() => {
        // Load recent airports from localStorage
        const savedRecentFrom = localStorage.getItem('recentFromAirports');
        const savedRecentTo = localStorage.getItem('recentToAirports');
        if (savedRecentFrom) {
            setRecentFromAirports(JSON.parse(savedRecentFrom));
        }
        if (savedRecentTo) {
            setRecentToAirports(JSON.parse(savedRecentTo));
        }
        if (isActive && packageConfig) {
            setSelectedServices({ stay: packageConfig.selectedServices.hotel, flight: packageConfig.selectedServices.flight, car: packageConfig.selectedServices.transfer });
            const roomslist = packageConfig.searchData.rooms.map(room => ({
                ...room, errors: {}
            }));
            setRooms(roomslist);
            setFormData(prev => ({
                ...prev,
                from: packageConfig.searchData.flight?.from || '',
                to: packageConfig.searchData.flight?.to || '',
                fromLocation: packageConfig.searchData.flight?.fromLocation || prev.fromLocation,
                toLocation: packageConfig.searchData.flight?.toLocation || prev.toLocation,
                dates: packageConfig.searchData.dates ? [new Date(packageConfig.searchData.dates.checkIn), new Date(packageConfig.searchData.dates.checkOut)] : prev.dates,
                location: packageConfig.searchData.hotel?.location || '',
                lat: packageConfig.searchData.hotel?.lat || null,
                lng: packageConfig.searchData.hotel?.lng || null,
                city: packageConfig.searchData.hotel?.city || '',
                code: packageConfig.searchData.hotel?.countryCode || '',
                country: packageConfig.searchData.hotel?.country || '',
                cabinClass: packageConfig.searchData.flight?.cabinClass || 'Y',
                cabinClassName: packageConfig.searchData.flight?.cabinClassName || 'economy',
                adults: packageConfig.searchData.totalGuests?.adults || 1,
                children: packageConfig.searchData.totalGuests?.children || 0,
                infants: packageConfig.searchData.totalGuests?.infants || 0,
            }))
        }
        const handleResize = () => {
            setBreakPoint(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [])

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

        // Convert to array of countries with their airports, limit total to 150 airports
        const countriesArray = Object.entries(groupedByCountry)
            .map(([country, airports]) => ({
                country,
                airports: airports.slice(0, 20) // Max 20 airports per country
            }))
            .slice(0, 10); // Max 10 countries

        return countriesArray;
    };

    // Get selected airport details
    const getAirportLabel = (code) => {
        const airport = AirportList.find(a => a.airportCode === code);
        return airport ? `${airport.cityName} (${airport.airportCode})` : '';
    };

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

    // Fetch location details using backend API
    const fetchAirportLocationDetails = async (airportCode, type) => {
        try {
            // Get airport details from AirportList
            const airport = AirportList.find(a => a.airportCode === airportCode);
            if (!airport) return;
            setPlaceApiLoader(true);
            // Call backend API to get location details
            const response = await fetch(
                `/api/places/airport-location?airportName=${encodeURIComponent(airport.airportName)}&cityName=${encodeURIComponent(airport.cityName)}&countryName=${encodeURIComponent(airport.countryName)}`
            );

            const data = await response.json();
            setPlaceApiLoader(false);
            if (data.success && data.location) {
                // Update FormData with location details from API
                setFormData(prev => ({
                    ...prev,
                    [type === 'from' ? 'fromLocation' : 'toLocation']: data.location
                }));
            } else {
                // Fallback to airport data if API fails
                const locationData = {
                    lat: null,
                    lng: null,
                    city: airport.cityName,
                    country: airport.countryName,
                    countryCode: airport.countryCode,
                    airportName: airport.airportName
                };

                setFormData(prev => ({
                    ...prev,
                    [type === 'from' ? 'fromLocation' : 'toLocation']: locationData
                }));
            }

        } catch (error) {
            console.error('Error fetching airport location details:', error);
            setPlaceApiLoader(false);

            // Fallback to airport data from AirportList
            const airport = AirportList.find(a => a.airportCode === airportCode);
            if (airport) {
                const locationData = {
                    lat: null,
                    lng: null,
                    city: airport.cityName,
                    country: airport.countryName,
                    countryCode: airport.countryCode,
                    airportName: airport.airportName
                };

                setFormData(prev => ({
                    ...prev,
                    [type === 'from' ? 'fromLocation' : 'toLocation']: locationData
                }));
            }
        }
    };

    // Handle airport selection with location details
    const handleAirportSelect = (airportCode, type) => {
        setFormData(prev => ({
            ...prev,
            [type]: airportCode
        }));

        addToRecentAirports(airportCode, type);

        // Fetch location details for the selected airport
        if (airportCode) {
            fetchAirportLocationDetails(airportCode, type);
        }
    };

    const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
    const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);
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
    const handleServiceChange = (service, checked) => {
        setSelectedServices(prev => ({
            ...prev,
            [service]: checked
        }));
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
    const selectedServiceCount = Object.values(selectedServices).filter(Boolean).length;
    const hasMinimumServices = selectedServiceCount >= 2;

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
        setPopoverOpened(false);
    };
    const handleLocationChange = (e) => {
        setFormData((prev) => ({ ...prev, location: e.target.value }));
    };

    const handlePlaceSelected = (place) => {
        if (!place.geometry) return;
        const lat = place.geometry?.location?.lat;
        const lng = place.geometry?.location?.lng;
        let city = "";
        let country = "";
        let code = "";
        place.address_components.forEach((component) => {
            if (component.types.includes("locality")) {
                city = component.long_name;
            } else if (component.types.includes("postal_town")) {
                city = component.long_name;
            }
            if (component.types.includes("country")) {
                country = component.long_name;
                code = component.short_name;
            }
        });

        setFormData((prev) => ({
            ...prev,
            location: place.displayName || place.formatted_address,
            lat,
            lng,
            city,
            code,
            country,
        }));
    };

    // Validation function
    const validateForm = () => {
        // Check if at least 2 services are selected
        if (!hasMinimumServices) {
            notifications.show({
                title: 'Service Selection Required',
                message: 'Please select at least two services to proceed.',
                autoClose: 3000,
                color: 'orange'
            });
            return false;
        }

        // Check validation based on selected services
        const showLocationSelector = selectedServices.stay && selectedServices.car && !selectedServices.flight;

        if (showLocationSelector) {
            // Validate location when showing location selector
            if (!FormData.location) {
                notifications.show({
                    title: 'Location Required',
                    message: 'Please select a destination location.',
                    autoClose: 3000,
                    color: 'red'
                });
                return false;
            }
        } else {
            // Validate airports when showing airport selectors
            if (!FormData.from) {
                notifications.show({
                    title: 'Departure Airport Required',
                    message: 'Please select your departure airport.',
                    autoClose: 3000,
                    color: 'red'
                });
                return false;
            }

            if (!FormData.to) {
                notifications.show({
                    title: 'Destination Airport Required',
                    message: 'Please select your destination airport.',
                    autoClose: 3000,
                    color: 'red'
                });
                return false;
            }

            if (FormData.from === FormData.to) {
                notifications.show({
                    title: 'Invalid Selection',
                    message: 'Departure and destination airports cannot be the same.',
                    autoClose: 3000,
                    color: 'red'
                });
                return false;
            }
        }

        // Validate dates
        if (!FormData.dates || !FormData.dates[0] || !FormData.dates[1]) {
            notifications.show({
                title: 'Dates Required',
                message: 'Please select check-in and check-out dates.',
                autoClose: 3000,
                color: 'red'
            });
            return false;
        }

        // Validate rooms and children ages
        for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];
            if (room.children > 0) {
                const hasEmptyAge = room.childrenAges.some((age) => !age);
                if (hasEmptyAge) {
                    notifications.show({
                        title: 'Children Ages Required',
                        message: `Please select age for all children in Room ${i + 1}.`,
                        autoClose: 3000,
                        color: 'red'
                    });
                    return false;
                }
            }
        }

        // Validate at least one adult
        if (totalAdults < 1) {
            notifications.show({
                title: 'Adult Required',
                message: 'At least one adult is required.',
                autoClose: 3000,
                color: 'red'
            });
            return false;
        }

        return true;
    };

    // Submit function to create API request
    const handleSearch = async () => {
        // Validate form first
        if (!validateForm()) {
            return;
        }
        // Prepare service configuration for package store
        const packageServices = {
            hotel: selectedServices.stay,
            flight: selectedServices.flight,
            transfer: selectedServices.car,
        };
        // Prepare search data
        const searchData = {
            services: packageServices,
            ...(selectedServices.flight && {
                flight: {
                    from: FormData.from,
                    to: FormData.to,
                    cabinClass: FormData.cabinClass,
                    cabinClassName: FormData.cabinClassName,
                    // Include location details for transfer service
                    fromLocation: FormData.fromLocation,
                    toLocation: FormData.toLocation
                }
            }),
            ...(selectedServices.stay && {
                hotel: {
                    location: FormData.location,
                    lat: FormData.lat,
                    lng: FormData.lng,
                    city: FormData.city,
                    country: FormData.country,
                    countryCode: FormData.code
                }
            }),
            dates: {
                checkIn: moment(FormData.dates[0]).format('YYYY-MM-DD'),
                checkOut: moment(FormData.dates[1]).format('YYYY-MM-DD')
            },
            rooms: rooms.map(room => ({
                adults: room.adults,
                children: room.children,
                childrenAges: room.childrenAges
            })),
            totalGuests: {
                adults: selectedServices.stay ? totalAdults : FormData.adults,
                children: selectedServices.stay ? totalChildren : FormData.children,
                infants: selectedServices.stay ? 0 : FormData.infants,
            }
        };

        // Initialize the holiday package store
        clearPackageData();
        initializePackage(packageServices, searchData);
        const nextRoute = getNextRoute();
        if (onSearch) onSearch();
        router.push(nextRoute);
    };
    return (
        <div className="p-2">
            <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center">
                <div className="d-flex align-items-start justify-content-start text-start">
                    <Switch
                        checked={selectedServices.stay}
                        onChange={(event) => handleServiceChange('stay', event.currentTarget.checked)}
                        color='#004c4c'
                        label="Stay"
                    />
                    <Switch
                        className='ms-3'
                        checked={selectedServices.flight}
                        onChange={(event) => handleServiceChange('flight', event.currentTarget.checked)}
                        color='#004c4c'
                        label="Flight"
                    />
                    <Switch
                        className='ms-3'
                        checked={selectedServices.car}
                        onChange={(event) => handleServiceChange('car', event.currentTarget.checked)}
                        color='#004c4c'
                        label="Transfer"
                    />
                </div>
                {selectedServices.flight && (
                    <div className="traveller">
                        <select
                            className="form-select w-sm-100 form-select-sm"
                            value={FormData.cabinClass}
                            onChange={(e) => {
                                const selectedOption = e.target.options[e.target.selectedIndex];

                                setFormData((prev) => ({
                                    ...prev,
                                    cabinClass: e.target.value,
                                    cabinClassName: selectedOption.getAttribute("data-name"),
                                }));
                            }}
                            aria-label="Cabin Class"
                        >
                            <option value="Y" data-name="economy">Economy</option>
                            <option value="S" data-name="premium_economy">Premium Economy</option>
                            <option value="C" data-name="business">Business Class</option>
                            <option value="F" data-name="first">First Class</option>
                        </select>
                    </div>
                )}
            </div>
            {!hasMinimumServices ? (
                <div className="alert alert-warning mt-2 mb-0 py-2 mt-4" role="alert">
                    <small>
                        <b>Service Selection Required:</b> To proceed with your booking, please select at least two services from the available choices above. You can choose from <b>Stay</b> (hotel accommodation), <b>Flight</b> (air travel), and <b>Car</b> (transportation rental). Combine any two or all three services to create your perfect travel package. Simply toggle the switches above to activate the services you need.
                    </small>
                </div>
            ) : (
                <div className="row gx-lg-2 gy-2 mt-2">
                    <div className={` ${selectedServices.stay && selectedServices.car && !selectedServices.flight ? 'col-xl-4' : 'col-xl-5'} col-lg-12 col-md-12 col-12`}>
                        {(selectedServices.stay && selectedServices.car && !selectedServices.flight) ? (
                            <HotelLocationSelector
                                value={FormData.location}
                                onChange={handleLocationChange}
                                onPlaceSelected={handlePlaceSelected}
                                onLoadingChange={setPlaceApiLoader}
                                isMobile={breakPoint}
                            />
                        ) : (
                            <div className="row gy-2 gx-lg-2 gx-3 position-relative">
                                <div className="col-lg-6">
                                    <div className="d-flex align-items-center position-relative">
                                        <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                                            <FaMapMarkerAlt size={20} />
                                        </div>
                                        <GeneralAirportSelector
                                            value={FormData.from}
                                            onChange={(code) => handleAirportSelect(code, 'from')}
                                            excludeCode={FormData.to}
                                            label="Leaving From"
                                            type="from"
                                            isMobile={breakPoint}
                                            dropdownOpen={fromDropdownOpen}
                                            setDropdownOpen={setFromDropdownOpen}
                                            searchQuery={fromSearchQuery}
                                            setSearchQuery={setFromSearchQuery}
                                            recentAirports={recentFromAirports}
                                            addToRecentAirports={addToRecentAirports}
                                            filterAirports={filterAirports}
                                            getAirportLabel={getAirportLabel}
                                        />
                                    </div>
                                </div>
                                <div className='general-planeIcon'>
                                    <RiPlaneFill size={18} />
                                </div>
                                <div className="col-lg-6">
                                    <div className="d-flex align-items-center position-relative">
                                        <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                                            <FaMapMarkerAlt size={20} />
                                        </div>
                                        <GeneralAirportSelector
                                            value={FormData.to}
                                            onChange={(code) => handleAirportSelect(code, 'to')}
                                            excludeCode={FormData.from}
                                            label="Going To"
                                            type="to"
                                            isMobile={breakPoint}
                                            dropdownOpen={toDropdownOpen}
                                            setDropdownOpen={setToDropdownOpen}
                                            searchQuery={toSearchQuery}
                                            setSearchQuery={setToSearchQuery}
                                            recentAirports={recentToAirports}
                                            addToRecentAirports={addToRecentAirports}
                                            filterAirports={filterAirports}
                                            getAirportLabel={getAirportLabel}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={` ${selectedServices.stay && selectedServices.car && !selectedServices.flight ? 'col-xl-8' : 'col-xl-7'} col-lg-12 col-md-12 col-12`}>
                        <div className="row  gy-3 gx-lg-2 gx-3">
                            <div className="col-lg-4">
                                <div className="d-flex align-items-center position-relative">
                                    <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                                        <FaCalendarAlt size={20} />
                                    </div>
                                    <div className="form-floating w-100">
                                        <DatePickerInput
                                            variant="unstyled"
                                            id="floatingInput2"
                                            minDate={new Date()}
                                            valueFormat="DD-MM-YYYY"
                                            value={FormData.dates}
                                            onChange={(dates) => setFormData(prev => ({ ...prev, dates }))}
                                            numberOfColumns={breakPoint ? 1 : 2}
                                            className="form-control hotel-date-range"
                                            style={{ paddingLeft: '40px' }}
                                            type="range"
                                        />
                                        <label htmlFor="floatingInput2" style={{ paddingLeft: '40px' }}>Dates</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4">
                                {selectedServices.stay ? (
                                    <Popover
                                        width={300}
                                        opened={popoverOpened}
                                        onChange={setPopoverOpened}
                                        position="bottom"
                                        withArrow
                                        shadow="md"
                                        styles={{
                                            dropdown: {
                                                maxHeight: 380,       // fixed height
                                                overflowY: "auto",    // enable scroll
                                            },
                                        }}
                                        clickOutsideEvents={["mouseup", "touchend"]}
                                    >
                                        <Popover.Target>
                                            <div className="d-flex align-items-center position-relative">
                                                <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                                                    <FaUsers size={20} />
                                                </div>
                                                <div className="form-floating w-100">
                                                    <button
                                                        id="floatingInput3"
                                                        onClick={() => setPopoverOpened((o) => !o)}
                                                        className="form-control btn btn-light text-start person-selection w-100"
                                                        style={{ paddingLeft: '40px' }}
                                                    >
                                                        {totalAdults + totalChildren} traveler{totalAdults + totalChildren !== 1 ? 's' : ''}, {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                                                    </button>
                                                    <label htmlFor="floatingInput3" style={{ paddingLeft: '40px' }}>Guests</label>
                                                </div>
                                            </div>
                                        </Popover.Target>
                                        <Popover.Dropdown>
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
                                                                <label className="small " >
                                                                    Adults
                                                                </label>
                                                            </div>
                                                            <div className="e301a14002">
                                                                <div className="e301a14002">
                                                                    <button onClick={() => handleRoomChange(index, "adults", -1)} className="adult-modal-btn" >
                                                                        <FaMinus />
                                                                    </button>
                                                                    <span className="mx-2" aria-hidden="true">
                                                                        {room.adults}
                                                                    </span>
                                                                    <button onClick={() => handleRoomChange(index, "adults", 1)} className="adult-modal-btn" >
                                                                        <FaPlus />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="e484bb5b7a mt-2">
                                                            <div className="c5aae0350e">
                                                                <label className="small " >
                                                                    Children
                                                                </label>
                                                            </div>
                                                            <div className="e301a14002">
                                                                <div className="e301a14002">
                                                                    <button onClick={() => handleRoomChange(index, "children", -1)} className="adult-modal-btn" >
                                                                        <FaMinus />
                                                                    </button>
                                                                    <span className="mx-2" aria-hidden="true">
                                                                        {room.children}
                                                                    </span>
                                                                    <button onClick={() => handleRoomChange(index, "children", 1)} className="adult-modal-btn" >
                                                                        <FaPlus />
                                                                    </button>
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
                                                                            <option key={n + 1} value={n + 1}>
                                                                                {n + 1}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {room.errors.childrenAges && (
                                                            <p className="text-danger small mt-1">
                                                                {room.errors.childrenAges}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                                <hr />
                                                <p onClick={addRoom} className="small cursor-pointer text-end mb-1 text-primary">+ Add Room</p>
                                                <button onClick={ClosePopover} type="button" className="btn  w-100 btn-outline-success">Done</button>
                                            </div>
                                        </Popover.Dropdown>
                                    </Popover>
                                ) : (
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
                                            <div>
                                                <div className="d-flex align-items-center position-relative">
                                                    <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                                                        <IoMdPerson size={20} />
                                                    </div>
                                                    <div className="form-floating w-100">
                                                        <button id="floatingInput" style={{ paddingLeft: '40px' }} className="btn-sm flight-traveler-btn-size form-control text-start" onClick={() => setPopoverOpened((o) => !o)}>
                                                            {FormData.adults + FormData.children + FormData.infants} traveler{FormData.adults + FormData.children + FormData.infants !== 1 ? 's' : ''}
                                                        </button>
                                                        <label style={{ paddingLeft: '40px' }} htmlFor="floatingInput">Travelers</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </Popover.Target>
                                        <Popover.Dropdown>
                                            <div className="p-2">
                                                <div>
                                                    <div className="e484bb5b7a mt-2">
                                                        <div className="c5aae0350e">
                                                            <label className="small " >
                                                                Adults
                                                            </label>
                                                        </div>
                                                        <div className="e301a14002">
                                                            <div className="e301a14002">
                                                                <button onClick={() => handleCountChange('adults', false)} className="adult-modal-btn" >
                                                                    <FaMinus />
                                                                </button>
                                                                <span className="mx-2" aria-hidden="true">
                                                                    {FormData.adults}
                                                                </span>
                                                                <button onClick={() => handleCountChange('adults', true)} className="adult-modal-btn" >
                                                                    <FaPlus />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="e484bb5b7a mt-2">
                                                        <div className="c5aae0350e">
                                                            <label className="small " >
                                                                Children
                                                            </label>
                                                        </div>
                                                        <div className="e301a14002">
                                                            <div className="e301a14002">
                                                                <button onClick={() => handleCountChange('children', false)} className="adult-modal-btn" >
                                                                    <FaMinus />
                                                                </button>
                                                                <span className="mx-2" aria-hidden="true">
                                                                    {FormData.children}
                                                                </span>
                                                                <button onClick={() => handleCountChange('children', true)} className="adult-modal-btn" >
                                                                    <FaPlus />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="e484bb5b7a mt-2">
                                                        <div className="c5aae0350e">
                                                            <label className="small " >
                                                                Infant
                                                            </label>
                                                        </div>
                                                        <div className="e301a14002">
                                                            <div className="e301a14002">
                                                                <button onClick={() => handleCountChange('infants', false)} className="adult-modal-btn" >
                                                                    <FaMinus />
                                                                </button>
                                                                <span className="mx-2" aria-hidden="true">
                                                                    {FormData.infants}
                                                                </span>
                                                                <button onClick={() => handleCountChange('infants', true)} className="adult-modal-btn" >
                                                                    <FaPlus />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setPopoverOpened(false)} type="button" className="btn mt-3 w-100 btn-outline-success">Done</button>
                                            </div>
                                        </Popover.Dropdown>
                                    </Popover>
                                )}
                            </div>

                            <div className="col-lg-4">
                                <button

                                    className="btn btn-success search-btn-styling-home bg-color w-100 h-100"
                                    type="button"
                                    disabled={placeApiLoader}
                                    onClick={handleSearch}
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
