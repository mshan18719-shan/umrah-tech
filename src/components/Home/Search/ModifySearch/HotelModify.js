"use client";
import React, { useEffect, useState } from "react";
import { DateInput } from "@mantine/dates";
import { Popover } from "@mantine/core";
import { FaCalendarAlt, FaMinus, FaPlus, FaSearch, FaUsers } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import HotelLocationSelector from '../HotelLocationSelector';
import listingStyles from '../UmrahGetAwayListing.module.css';

const MAX_ROOMS = 5;
const MAX_ADULTS_PER_ROOM = 6;
const MAX_CHILDREN_PER_ROOM = 4;

const parseStoredDate = (value) => {
  if (!value) return null;
  const parsed = moment(value, ['YYYY-MM-DD', 'DD-MM-YYYY'], true);
  return parsed.isValid() ? parsed.toDate() : null;
};

export default function HotelModify({ onSearch }) {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rooms, setRooms] = useState([
    { adults: 2, children: 0, childrenAges: [], errors: {} }
  ]);
  const [formData, setFormData] = useState({
    location: "",
    city: "",
    code: "",
    country: "",
    lat: null,
    lng: null,
    dateRange: [],
  });
  const [clientNationality, setClientNationality] = useState('');

  const addRoom = () => {
    if (rooms.length >= MAX_ROOMS) {
      notifications.show({
        autoClose: 2500,
        title: "Room limit",
        message: `You can add up to ${MAX_ROOMS} rooms.`,
        color: "red",
      });
      return;
    }
    setRooms([...rooms, { adults: 2, children: 0, childrenAges: [], errors: {} }]);
  };

  useEffect(() => {
    if (searchParams && searchParams.toString()) {
      const city = searchParams.get("city");
      const countryCode = searchParams.get("code");
      const clientNationality = searchParams.get("nationality");
      const check_in = searchParams.get("checkIn");
      const check_out = searchParams.get("checkOut");
      const lat = searchParams.get("lat");
      const long = searchParams.get("lng");
      const location = searchParams.get("location");
      const country = searchParams.get("country");
      const place = searchParams.get("place");
      setClientNationality(clientNationality);
      setFormData({
        location: location,
        city: city,
        code: countryCode,
        country: country,
        lat: lat,
        lng: long,
        dateRange: [check_in, check_out],
      });
      const loc = document.getElementsByName('hotellocation')[0];
      if (loc) loc.value = place;
    } else {
      const data = localStorage.getItem('HotelSearchData');
      if (data) {
        const newData = JSON.parse(data);
        setFormData({
          location: newData?.location,
          city: newData?.city,
          code: newData?.countryCode,
          country: newData?.country,
          lat: newData?.lat,
          lng: newData?.long,
          dateRange: [newData?.check_in, newData?.check_out],
        });
        const loc = document.getElementsByName('hotellocation')[0];
        if (loc) loc.value = newData?.location;
      }
    }

    let RoomMap = [];
    const roomData = localStorage.getItem('searchRoomSelection');
    if (roomData) {
      RoomMap = JSON.parse(roomData);
    }
    const formattedRooms = RoomMap.slice(0, MAX_ROOMS).map(item => {
      const childrenList = Array.isArray(item.children) ? item.children : [];
      const clampedChildren = childrenList.slice(0, MAX_CHILDREN_PER_ROOM);
      return {
        adults: Math.min(MAX_ADULTS_PER_ROOM, Math.max(1, Number(item.adults) || 1)),
        children: clampedChildren.length,
        childrenAges: clampedChildren.map(c => c?.age ?? c),
        errors: {}
      };
    });
    if (formattedRooms.length) {
      setRooms(formattedRooms);
    }
  }, [searchParams]);

  const removeRoom = (index) => {
    if (rooms.length === 1) return;
    const updatedRooms = rooms.filter((_, i) => i !== index);
    setRooms(updatedRooms);
  };

  const handleRoomChange = (index, type, delta) => {
    const updatedRooms = [...rooms];

    if (type === "adults") {
      if (delta > 0 && updatedRooms[index].adults >= MAX_ADULTS_PER_ROOM) {
        notifications.show({
          autoClose: 2500,
          title: "Adult limit",
          message: `Maximum ${MAX_ADULTS_PER_ROOM} adults per room.`,
          color: "red",
        });
        return;
      }
      updatedRooms[index].adults = Math.min(
        MAX_ADULTS_PER_ROOM,
        Math.max(1, updatedRooms[index].adults + delta)
      );
    } else if (type === "children") {
      const prevCount = updatedRooms[index].children;
      if (delta > 0 && prevCount >= MAX_CHILDREN_PER_ROOM) {
        notifications.show({
          autoClose: 2500,
          title: "Child limit",
          message: `Maximum ${MAX_CHILDREN_PER_ROOM} children per room.`,
          color: "red",
        });
        return;
      }
      const newCount = Math.min(
        MAX_CHILDREN_PER_ROOM,
        Math.max(0, prevCount + delta)
      );
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
    const next = e.target.value;
    setFormData((prev) => ({
      ...prev,
      location: next,
      ...(next
        ? {}
        : { city: '', code: '', country: '', lat: null, lng: null }),
    }));
  };

  const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);

  const guestsLabel = `${totalAdults} Adult${totalAdults !== 1 ? 's' : ''}${totalChildren > 0 ? `, ${totalChildren} Child${totalChildren !== 1 ? 'ren' : ''}` : ''} · ${rooms.length} Room${rooms.length !== 1 ? 's' : ''}`;

  const handlePlaceSelected = (place) => {
    if (!place.geometry) return;

    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    let city = "";
    let country = "";
    let code = "";
    place.address_components.forEach((component) => {
      if (component.types.includes("locality") || component.types.includes("postal_town")) {
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

  const handleCheckInChange = (date) => {
    const formatted = date ? moment(date).format('YYYY-MM-DD') : null;
    setFormData((prev) => {
      const next = [formatted, prev.dateRange[1]];
      const checkOut = parseStoredDate(prev.dateRange[1]);
      if (formatted && checkOut && moment(checkOut).isSameOrBefore(moment(formatted))) {
        next[1] = moment(formatted).add(1, 'day').format('YYYY-MM-DD');
      }
      return { ...prev, dateRange: next };
    });
  };

  const handleCheckOutChange = (date) => {
    const formatted = date ? moment(date).format('YYYY-MM-DD') : null;
    setFormData((prev) => ({ ...prev, dateRange: [prev.dateRange[0], formatted] }));
  };

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

    const hasRoomErrors = updatedRooms.some((room) => Object.keys(room.errors).length > 0);
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

    const queryParams = new URLSearchParams();
    const locationEl = document.getElementsByName('hotellocation')[0];
    const locationName = locationEl ? locationEl.value : formData.location;
    queryParams.set('checkIn', formData.dateRange[0]);
    queryParams.set('checkOut', formData.dateRange[1]);
    queryParams.set('currency', 'GBP');
    queryParams.set('place', locationName);
    queryParams.set('city', formData.city);
    queryParams.set('nationality', clientNationality);
    queryParams.set('lat', formData.lat);
    queryParams.set('lng', formData.lng);
    queryParams.set('code', formData.code);
    queryParams.set('location', formData.location);
    queryParams.set('country', formData.country);
    localStorage.setItem('searchRoomSelection', JSON.stringify(roomsArray));
    if (onSearch) onSearch();
    router.push(`/hotels?${queryParams.toString()}`);
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
    const hasRoomErrors = updatedRooms.some((room) => Object.keys(room.errors).length > 0);
    if (hasRoomErrors) return;
    setPopoverOpened(false);
  };

  const guestsPopoverContent = (
    <div className="p-2">
      {rooms.map((room, index) => (
        <div key={index} className="mt-2">
          <div className="d-flex justify-content-between align-items-center">
            <p className="small m-0">Room {index + 1}</p>
            {index + 1 !== 1 && (
              <button onClick={() => removeRoom(index)} className="btn btn-danger x-small btn-sm" type="button">
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
              <button
                onClick={() => handleRoomChange(index, "adults", -1)}
                className="adult-modal-btn"
                type="button"
                disabled={room.adults <= 1}
              >
                <FaMinus />
              </button>
              <span className="mx-2" aria-hidden="true">{room.adults}</span>
              <button
                onClick={() => handleRoomChange(index, "adults", 1)}
                className="adult-modal-btn"
                type="button"
                disabled={room.adults >= MAX_ADULTS_PER_ROOM}
              >
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="e484bb5b7a mt-2">
            <div className="c5aae0350e">
              <label className="small">Children</label>
            </div>
            <div className="e301a14002">
              <button
                onClick={() => handleRoomChange(index, "children", -1)}
                className="adult-modal-btn"
                type="button"
                disabled={room.children <= 0}
              >
                <FaMinus />
              </button>
              <span className="mx-2" aria-hidden="true">{room.children}</span>
              <button
                onClick={() => handleRoomChange(index, "children", 1)}
                className="adult-modal-btn"
                type="button"
                disabled={room.children >= MAX_CHILDREN_PER_ROOM}
              >
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="d-flex mt-2 flex-wrap justify-content-between">
            {room.childrenAges.map((age, ageIndex) => (
              <div key={ageIndex} className="kids-age-select">
                <select
                  onChange={(e) => handleAgeChange(index, ageIndex, e.target.value)}
                  value={age || ''}
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
      {rooms.length < MAX_ROOMS ? (
        <p onClick={addRoom} className="small cursor-pointer text-end mb-1 text-primary">+ Add Room</p>
      ) : (
        <p className="small text-end mb-1 text-muted">Maximum {MAX_ROOMS} rooms</p>
      )}
      <button onClick={ClosePopover} type="button" className={listingStyles.doneBtn}>Done</button>
    </div>
  );

  const renderLocationField = () => (
    <HotelLocationSelector
      value={formData.location}
      onChange={handleLocationChange}
      onPlaceSelected={handlePlaceSelected}
      isMobile={false}
      variant="listing"
      city={formData.city}
      country={formData.country}
    />
  );

  const renderDateField = (field) => {
    const isCheckIn = field === 'checkIn';
    const label = isCheckIn ? 'CHECK-IN' : 'CHECK-OUT';
    const value = parseStoredDate(isCheckIn ? formData.dateRange[0] : formData.dateRange[1]);
    const minDate = isCheckIn ? new Date() : (parseStoredDate(formData.dateRange[0]) || new Date());

    return (
      <div className={listingStyles.listingField}>
        <div className={`${listingStyles.fieldIcon} ${listingStyles.iconBlue}`}><FaCalendarAlt /></div>
        <div className={listingStyles.fieldBody}>
          <span className={listingStyles.fieldLabel}>{label}</span>
          <div className={listingStyles.fieldValue}>
            <DateInput
              variant="unstyled"
              placeholder="Select date"
              valueFormat="DD MMM YYYY"
              value={value}
              onFocus={(e) => e.target.select()}
              onChange={(date) => (isCheckIn ? handleCheckInChange(date) : handleCheckOutChange(date))}
              minDate={minDate}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderGuestsField = () => (
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
        <div className={`${listingStyles.listingField} cursor-pointer`} onClick={() => setPopoverOpened((o) => !o)}>
          <div className={`${listingStyles.fieldIcon} ${listingStyles.iconBlue}`}><FaUsers /></div>
          <div className={listingStyles.fieldBody}>
            <span className={listingStyles.fieldLabel}>GUESTS</span>
            <button type="button" className={listingStyles.travelersBtn}>{guestsLabel}</button>
          </div>
        </div>
      </Popover.Target>
      <Popover.Dropdown>{guestsPopoverContent}</Popover.Dropdown>
    </Popover>
  );

  return (
    <div className={listingStyles.wrapper}>
      {/* <button type="button" className={listingStyles.backRow} onClick={() => router.back()}>
        <span>&#8249;</span> Back
      </button> */}
      <div className={listingStyles.searchRow}>
        <div className="d-flex flex-column flex-xl-row gap-3 w-100">
          <div className={listingStyles.fieldsCard}>
            <div className={listingStyles.fieldsRow}>
              {renderLocationField()}
              {renderDateField('checkIn')}
              {renderDateField('checkOut')}
              {renderGuestsField()}
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
