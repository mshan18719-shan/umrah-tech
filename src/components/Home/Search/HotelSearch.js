"use client";
import React, { useState, useEffect } from "react";
import { DateInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { Popover } from "@mantine/core";
import { FaMinus, FaPlus, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import moment from "moment";
import HotelLocationSelector from './HotelLocationSelector';
import homeStyles from './FlightSearchHome.module.css';

export default function HotelSearch() {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaceDetailsLoading, setIsPlaceDetailsLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [rooms, setRooms] = useState([
    { adults: 2, children: 0, childrenAges: [], errors: {} }
  ]);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const getCountry = async () => {
      try {
        const res = await fetch("https://api.country.is/");
        const data = await res.json();
        setCountryCode(data.country);
      } catch (error) {
        console.log(error);
      }
    };

    getCountry();
  }, []);

  const [formData, setFormData] = useState({
    location: "",
    city: "",
    code: "",
    country: "",
    lat: null,
    lng: null,
    dateRange: [moment().add(1, 'days').format('YYYY-MM-DD'), moment().add(2, 'days').format('YYYY-MM-DD')],
  });

  const addRoom = () => {
    setRooms([...rooms, { adults: 2, children: 0, childrenAges: [], errors: {} }]);
  };

  const router = useRouter();

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
    } else if (type === "children") {
      const prevCount = updatedRooms[index].children;
      const newCount = Math.max(0, prevCount + delta);

      updatedRooms[index].children = newCount;

      let ages = [...(updatedRooms[index].childrenAges || [])];

      if (newCount > prevCount) {
        ages.push(null);
      } else if (newCount < prevCount) {
        ages.pop();
      }

      updatedRooms[index].childrenAges = ages;

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

  const handleLocationChange = (e) => {
    setFormData((prev) => ({ ...prev, location: e.target.value }));
  };

  const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);
  const guestsLabel = `${totalAdults + totalChildren} traveler${totalAdults + totalChildren !== 1 ? 's' : ''}, ${rooms.length} room${rooms.length !== 1 ? 's' : ''}`;

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

  const parseStoredDate = (value) => (value ? moment(value, 'YYYY-MM-DD').toDate() : null);

  const formatStoredDate = (date) => (date ? moment(date).format('YYYY-MM-DD') : '');

  const handleCheckInChange = (date) => {
    setFormData((prev) => {
      const checkIn = formatStoredDate(date);
      let checkOut = prev.dateRange[1];
      if (checkIn && checkOut && moment(checkOut).isSameOrBefore(checkIn, 'day')) {
        checkOut = moment(checkIn).add(1, 'days').format('YYYY-MM-DD');
      }
      return { ...prev, dateRange: [checkIn, checkOut] };
    });
  };

  const handleCheckOutChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      dateRange: [prev.dateRange[0], formatStoredDate(date)],
    }));
  };

  const shiftDate = (field, days) => {
    const isCheckIn = field === 'checkIn';
    const current = parseStoredDate(isCheckIn ? formData.dateRange[0] : formData.dateRange[1]);
    const base = current ? new Date(current) : new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (base < today) return;

    if (!isCheckIn) {
      const checkIn = parseStoredDate(formData.dateRange[0]);
      if (checkIn) {
        const dep = new Date(checkIn);
        dep.setHours(0, 0, 0, 0);
        if (base <= dep) return;
      }
    }

    if (isCheckIn) {
      handleCheckInChange(base);
    } else {
      handleCheckOutChange(base);
    }
  };

  const renderDateField = (field) => {
    const isCheckIn = field === 'checkIn';
    const label = isCheckIn ? 'Check-in' : 'Check-out';
    const value = parseStoredDate(isCheckIn ? formData.dateRange[0] : formData.dateRange[1]);
    const minDate = isCheckIn
      ? new Date()
      : (parseStoredDate(formData.dateRange[0]) || new Date());

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
            onChange={(date) => (isCheckIn ? handleCheckInChange(date) : handleCheckOutChange(date))}
            minDate={minDate}
          />
        </div>
        <div className={homeStyles.dateNav}>
          <button
            type="button"
            className={homeStyles.dateNavBtn}
            onClick={() => shiftDate(field, -1)}
            disabled={!value}
          >
            &lt; Prev
          </button>
          <button
            type="button"
            className={homeStyles.dateNavBtn}
            onClick={() => shiftDate(field, 1)}
          >
            Next &gt;
          </button>
        </div>
      </div>
    );
  };

  const ClosePopover = () => {
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

  const guestsPopoverContent = (
    <div className="p-2">
      {rooms.map((room, index) => (
        <div key={index} className="mt-2">
          <div className="d-flex justify-content-between align-items-center">
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
              <label className="small">Adults</label>
            </div>
            <div className="e301a14002">
              <div className="e301a14002">
                <button onClick={() => handleRoomChange(index, "adults", -1)} className="adult-modal-btn">
                  <FaMinus />
                </button>
                <span className="mx-2" aria-hidden="true">{room.adults}</span>
                <button onClick={() => handleRoomChange(index, "adults", 1)} className="adult-modal-btn">
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
          <div className="e484bb5b7a mt-2">
            <div className="c5aae0350e">
              <label className="small">Children</label>
            </div>
            <div className="e301a14002">
              <div className="e301a14002">
                <button onClick={() => handleRoomChange(index, "children", -1)} className="adult-modal-btn">
                  <FaMinus />
                </button>
                <span className="mx-2" aria-hidden="true">{room.children}</span>
                <button onClick={() => handleRoomChange(index, "children", 1)} className="adult-modal-btn">
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
          <div className="d-flex mt-2 flex-wrap justify-content-between">
            {room.childrenAges.map((age, ageIndex) => (
              <div key={ageIndex} className="kids-age-select">
                <select
                  onChange={(e) => handleAgeChange(index, ageIndex, e.target.value)}
                  value={age}
                  className="form-control border form-control-sm"
                >
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
      <button onClick={ClosePopover} type="button" className="btn w-100 btn-outline-success">Done</button>
    </div>
  );

  const validateForm = () => {
    if (!formData.location) {
      notifications.show({
        autoClose: 2000,
        title: "Error",
        message: "Location is required",
        color: "red",
      });
      return false;
    }

    if (!formData.dateRange || formData.dateRange.length !== 2 || !formData.dateRange[0] || !formData.dateRange[1]) {
      notifications.show({
        autoClose: 2000,
        title: "Error",
        message: "Please select check-in and check-out dates",
        color: "red",
      });
      return false;
    }

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
      notifications.show({
        autoClose: 2000,
        title: "Error",
        message: "Please select age for all children",
        color: "red",
      });
      setPopoverOpened(true);
      return false;
    }

    return true;
  };

  const SubmitForm = () => {
    if (!validateForm()) return;

    const roomsArray = rooms.map(room => ({
      adults: room.adults,
      children: room.childrenAges.map(age => ({ age: Number(age) }))
    }));
    localStorage.setItem('clientNationality', countryCode);
    const queryParams = new URLSearchParams();
    const locationName = document.getElementsByName('hotellocation')[0].value;
    queryParams.set('checkIn', formData.dateRange[0]);
    queryParams.set('checkOut', formData.dateRange[1]);
    queryParams.set('currency', 'GBP');
    queryParams.set('place', locationName);
    queryParams.set('city', formData.city);
    queryParams.set('nationality', countryCode);
    queryParams.set('lat', formData.lat);
    queryParams.set('lng', formData.lng);
    queryParams.set('code', formData.code);
    queryParams.set('location', formData.location);
    queryParams.set('country', formData.country);
    localStorage.setItem('searchRoomSelection', JSON.stringify(roomsArray));
    router.push(`/hotels?${queryParams.toString()}`);
  };

  return (
    <div className={homeStyles.wrapper}>
      <div className={homeStyles.searchBar}>
        <div className={homeStyles.fieldsRow}>
          <div className={homeStyles.fromWrap}>
            <HotelLocationSelector
              value={formData.location}
              onChange={handleLocationChange}
              onPlaceSelected={handlePlaceSelected}
              isMobile={isMobile}
              onLoadingChange={setIsPlaceDetailsLoading}
              variant="home"
              city={formData.city}
              country={formData.country}
            />
          </div>
          <div className={homeStyles.fieldDivider} />
          {renderDateField('checkIn')}
          <div className={homeStyles.fieldDivider} />
          {renderDateField('checkOut')}
          <div className={homeStyles.fieldDivider} />
          <div className={homeStyles.locationFieldWrap}>
            <Popover
            width={300}
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-start"
            withArrow
            shadow="md"
            styles={{ dropdown: { maxHeight: 380, overflowY: "auto" } }}
            clickOutsideEvents={["mouseup", "touchend"]}
          >
            <Popover.Target>
              <div
                className={homeStyles.homeField}
                onClick={() => setPopoverOpened((o) => !o)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setPopoverOpened((o) => !o)}
              >
                <span className={homeStyles.homeFieldLabel}>Guests</span>
                <span className={homeStyles.homeFieldCode} style={{ fontSize: '17px' }}>{guestsLabel}</span>
              </div>
            </Popover.Target>
            <Popover.Dropdown>{guestsPopoverContent}</Popover.Dropdown>
          </Popover>
          </div>
        </div>
        <button
          type="button"
          onClick={SubmitForm}
          disabled={isPlaceDetailsLoading}
          className={homeStyles.searchBtn}
        >
          Search
        </button>
      </div>
    </div>
  );
}
