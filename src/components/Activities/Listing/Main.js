'use client'
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { useJsApiLoader } from "@react-google-maps/api";
import { BsCalendar2Date } from "react-icons/bs";
import { IoLocationSharp, IoTimeOutline } from "react-icons/io5";
import { HiTicket } from "react-icons/hi2";
import { MdEdit, MdLocationOn } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import moment from "moment";
import { DatePicker } from '@mantine/dates';
import PriceDisplay from "@/components/Currency/PriceDisplay";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";
import { notifications } from "@mantine/notifications";
import FilterSection from "./FilterSection";
import styles from "./Activities.module.css";
import ActivityLoader from "./ActivityLoader";

const GOOGLE_MAPS_LIBRARIES = ['places'];
const ACTIVITY_LISTING_RETURN_URL_KEY = 'activity_listing_return_url';

const slugifyCity = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

const parseCountryFromSecondary = (secondaryText) => {
  if (!secondaryText) return '';
  const parts = secondaryText.split(',');
  return parts[parts.length - 1].trim();
};

const humanizeSlug = (slug) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatActivityType = (type) =>
  type
    ? type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Experience';

const getActivityDescription = (item) =>
  item?.content_text ||
  item?.content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
  '';

function SuggestionThumbnail({ label, photoUrl }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={styles.suggestionThumbnailWrap}>
      <div className={styles.suggestionThumbnailFallback}>
        {label ? label.charAt(0) : <FaMapMarkerAlt size={16} />}
      </div>
      {photoUrl && !failed && (
        <img
          src={photoUrl}
          alt={label}
          className={`${styles.suggestionThumbnail} ${styles.suggestionThumbnailLoaded} ${loaded ? styles.suggestionThumbnailVisible : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function Main() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  const { currency, rates } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [activityList, setActivityList] = useState([]);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const calendarRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);
  const latestQueryRef = useRef('');
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const fetchedPhotosRef = useRef(new Set());
  const [googlePredictions, setGooglePredictions] = useState([]);
  const [photoCache, setPhotoCache] = useState({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Dynamic destinations from API
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateView = () => setIsDesktop(mediaQuery.matches);
    updateView();
    mediaQuery.addEventListener('change', updateView);
    return () => mediaQuery.removeEventListener('change', updateView);
  }, []);

  // Fetch destinations from API
  useEffect(() => {
    GetDestinations();
  }, []);

  const GetDestinations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/destinations`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (data.Success === true) {
        const NewList = data.Content.destinations
          .filter(item => item.city !== null)
          .map(item => ({
            id: item.id,
            value: item.city_slug,
            label: item.city,
            country: item.country,
            source: 'api',
          }));

        const uniqueList = [
          ...new Map(NewList.map((item) => [item.value, item])).values(),
        ];
        setDestinations(uniqueList);
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
      setDestinations([]);
    }
  }

  useEffect(() => {
    const citySlug = searchParams.get('city');
    const countryParam = searchParams.get('country');
    const dateParam = searchParams.get('date');

    if (dateParam) {
      const parsedDate = moment(dateParam, 'YYYY-MM-DD').toDate();
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
        setCalendarViewDate(parsedDate);
      }
    }

    if (citySlug) {
      const matchedDest = destinations.find((dest) => dest.value === citySlug);
      const locationFromParams = matchedDest || {
        value: citySlug,
        label: humanizeSlug(citySlug),
        country: countryParam || '',
        source: 'url',
      };

      setSelectedLocation(locationFromParams);
      setSearchQuery(locationFromParams.label);
    } else {
      setSelectedLocation(null);
      setSearchQuery('');
    }
  }, [searchParams, destinations]);

  // Close calendar and search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isGoogleLoaded || !window.google?.maps?.places) return;
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    placesServiceRef.current = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );
  }, [isGoogleLoaded]);

  const fetchPlacePhoto = useCallback((placeId, query) => {
    if (!placesServiceRef.current || fetchedPhotosRef.current.has(placeId)) return;
    fetchedPhotosRef.current.add(placeId);

    placesServiceRef.current.getDetails(
      { placeId, fields: ['photos'] },
      (place, status) => {
        if (latestQueryRef.current !== query) return;
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) return;

        const photoUrl = place?.photos?.[0]?.getUrl({ maxWidth: 96 });
        if (photoUrl) {
          setPhotoCache((prev) => ({ ...prev, [placeId]: photoUrl }));
        }
      }
    );
  }, []);

  const searchGooglePlaces = useCallback((query) => {
    if (!query || query.length < 2) {
      setGooglePredictions([]);
      return;
    }

    if (!isGoogleLoaded || !autocompleteServiceRef.current) return;

    latestQueryRef.current = query;
    setIsGoogleLoading(true);

    autocompleteServiceRef.current.getPlacePredictions(
      { input: query, types: ['(regions)'] },
      (predictions, status) => {
        if (latestQueryRef.current !== query) return;

        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
          const limited = predictions.slice(0, 5);
          setGooglePredictions(limited);
          limited.slice(0, 4).forEach((prediction) => {
            fetchPlacePhoto(prediction.place_id, query);
          });
        } else {
          setGooglePredictions([]);
        }

        if (latestQueryRef.current === query) {
          setIsGoogleLoading(false);
        }
      }
    );
  }, [isGoogleLoaded, fetchPlacePhoto]);

  // Filter destinations based on search query (only filter when user is actively typing, not when a location is already selected)
  const isActivelyTyping = searchQuery.trim() && searchQuery !== selectedLocation?.label;
  const filteredDestinations = isActivelyTyping
    ? destinations.filter(destination =>
      destination.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (destination.country && destination.country.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : destinations;

  const hasGoogleResults = isActivelyTyping && googlePredictions.length > 0;
  const hasLocalResults = filteredDestinations.length > 0;
  const showNoResults = isActivelyTyping && !isGoogleLoading && !hasGoogleResults && !hasLocalResults;

  const handleSearchSelect = (destination) => {
    setSearchQuery(destination.label);
    setSelectedLocation(destination);
    setShowSearchDropdown(false);
    setGooglePredictions([]);
  };

  const handleSearchSubmit = (onSearchDone) => {
    if (!selectedLocation) {
      notifications.show({
        title: 'Error',
        message: 'Please select a city',
        color: 'red',
      });
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('city', selectedLocation.value);
    if (selectedLocation.country) {
      params.set('country', selectedLocation.country);
    } else {
      params.delete('country');
    }
    if (selectedDate) {
      params.set('date', moment(selectedDate).format('YYYY-MM-DD'));
    }
    router.push(`?${params.toString()}`);
    onSearchDone?.();
  };

  const handleGoogleSelect = (prediction) => {
    const mainText = prediction.structured_formatting?.main_text || prediction.description;
    const secondaryText = prediction.structured_formatting?.secondary_text || '';
    const country = parseCountryFromSecondary(secondaryText) || secondaryText;

    const matched = destinations.find(
      (d) => d.label.toLowerCase() === mainText.toLowerCase()
    );

    handleSearchSelect({
      id: prediction.place_id,
      value: matched?.value || slugifyCity(mainText),
      label: mainText,
      country,
      source: 'google',
      placeId: prediction.place_id,
      photoUrl: photoCache[prediction.place_id],
    });
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (selectedLocation && value !== selectedLocation.label) {
      setSelectedLocation(null);
    }
    setShowSearchDropdown(true);
  };

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (isActivelyTyping) {
      searchTimeout.current = setTimeout(() => {
        searchGooglePlaces(searchQuery);
      }, 150);
    } else {
      setGooglePredictions([]);
      setIsGoogleLoading(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, isActivelyTyping, searchGooglePlaces]);

  const renderDestinationItem = (destination, isSelected = false) => {
    if (selectedLocation && !isSelected && selectedLocation.value === destination.value) return null;

    return (
      <li
        key={`${destination.source || 'api'}-${destination.value}`}
        className={`${styles.suggestionItem} ${isSelected ? styles.selectedItem : ''}`}
        onClick={() => handleSearchSelect(destination)}
      >
        <SuggestionThumbnail label={destination.label} photoUrl={destination.photoUrl} />
        <div className={styles.suggestionContent}>
          <span className={styles.suggestionTitle}>{destination.label}</span>
          <span className={styles.suggestionCategory}>{destination.country}</span>
        </div>
        {isSelected && <span className={styles.selectedBadge}>Selected</span>}
      </li>
    );
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCalendarViewDate(date);
    setShowCalendar(false);
  };



  useEffect(() => {
    async function getActivities() {
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/search?${searchParams}`,
          {
            cache: 'no-store',
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
        const response = await res.json();
        setIsLoading(false)
        if (response.Success) {
          setActivityList(response?.Content?.activities)
        }
      } catch (error) {
        setIsLoading(false)
        console.log(error)
      }
    }
    getActivities();
  }, [searchParams]);

  // Calculate min and max price dynamically from listing and convert to display currency
  const { minPrice, maxPrice, originalCurrency, displayCurrency } = React.useMemo(() => {
    if (!activityList || activityList.length === 0) {
      return { minPrice: 0, maxPrice: 1000, originalCurrency: 'GBP', displayCurrency: currency };
    }

    const prices = activityList.map(activity => Number(activity.sale_price || 0)).filter(p => p > 0);
    if (prices.length === 0) {
      return { minPrice: 0, maxPrice: 1000, originalCurrency: 'GBP', displayCurrency: currency };
    }

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    const activityCurrency = activityList[0]?.currency_code || 'GBP';

    // Try to convert to display currency
    try {
      // Skip conversion if selected currency is same as activity currency
      if (currency === activityCurrency) {
        return {
          minPrice: min,
          maxPrice: max,
          originalCurrency: activityCurrency,
          displayCurrency: activityCurrency
        };
      }

      const { newprice: convertedMin } = ConvertPrice(min, activityCurrency, currency, rates);
      const { newprice: convertedMax } = ConvertPrice(max, activityCurrency, currency, rates);

      // Check if conversion was successful and actually changed the value
      const minConverted = Number(convertedMin);
      const maxConverted = Number(convertedMax);

      // Conversion is valid if:
      // 1. Numbers are valid
      // 2. Both are positive
      // 3. Values actually changed (not same as original, allowing 1% difference)
      const minChanged = Math.abs(minConverted - min) > (min * 0.01);
      const maxChanged = Math.abs(maxConverted - max) > (max * 0.01);

      if (!isNaN(minConverted) && !isNaN(maxConverted) &&
        minConverted > 0 && maxConverted > 0 &&
        (minChanged || maxChanged)) {
        // Conversion successful and values changed
        return {
          minPrice: Math.floor(minConverted),
          maxPrice: Math.ceil(maxConverted),
          originalCurrency: activityCurrency,
          displayCurrency: currency
        };
      }
    } catch (error) {
      console.warn('Currency conversion failed, using original currency:', error);
    }

    // If conversion fails, use original currency
    return {
      minPrice: min,
      maxPrice: max,
      originalCurrency: activityCurrency,
      displayCurrency: activityCurrency
    };
  }, [activityList, currency, rates]);

  // Set initial price range when activities load or currency changes
  React.useEffect(() => {
    if (activityList.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [activityList, minPrice, maxPrice, displayCurrency]);

  const getDisplayPrice = React.useCallback((activity) => {
    const activityCurrency = activity.currency_code || 'GBP';
    const activityPrice = Number(activity.sale_price || 0);
    if (activityPrice <= 0) return 0;

    let price = activityPrice;
    try {
      if (displayCurrency !== activityCurrency) {
        const { newprice: convertedPrice } = ConvertPrice(activityPrice, activityCurrency, displayCurrency, rates);
        const converted = Number(convertedPrice);
        const valueChanged = Math.abs(converted - activityPrice) > (activityPrice * 0.01);

        if (!isNaN(converted) && converted > 0 && valueChanged) {
          price = converted;
        }
      }
    } catch (error) {
      console.warn('Price conversion failed:', error);
    }

    return price;
  }, [displayCurrency, rates]);

  // Apply filters to activity list
  const filteredActivities = React.useMemo(() => {
    if (!activityList || activityList.length === 0) return [];

    const filtered = activityList.filter(activity => {
      const price = getDisplayPrice(activity);

      // Price range filter - compare converted prices
      if (price > 0 && (price < priceRange[0] || price > priceRange[1])) {
        return false;
      }

      // Duration filters (dynamic values from API)
      if (activeFilters.length > 0) {
        const durationFilters = activeFilters
          .filter((filter) => filter.startsWith('duration_'))
          .map((filter) => filter.replace('duration_', ''));

        if (durationFilters.length > 0) {
          const activityDuration = activity.activity_duration?.trim() || '';
          if (!durationFilters.includes(activityDuration)) return false;
        }
      }

      return true;
    });

    if (sortBy === 'price_low') {
      return [...filtered].sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
    }

    if (sortBy === 'price_high') {
      return [...filtered].sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
    }

    return filtered;
  }, [activityList, priceRange, activeFilters, sortBy, getDisplayPrice]);

  const renderSearchFields = (onSearchDone) => (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputWrapper} ref={searchRef}>
        <label className={styles.searchFieldLabel}>Destination</label>
        <div className={styles.searchFieldInner}>
          <FaSearch className={styles.searchFieldIcon} />
          <input
            type="text"
            placeholder="Search destinations, cities..."
            className={styles.searchInput}
            value={searchQuery}
            autoComplete="off"
            onChange={handleSearchInputChange}
            onFocus={() => setShowSearchDropdown(true)}
          />
          {selectedLocation && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setSelectedLocation(null);
                setSearchQuery('');
                setGooglePredictions([]);
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}
        </div>
        {showSearchDropdown && (
          <div className={`${styles.searchDropdown} activity-search-dropdown`}>
            <div className={styles.searchDropdownHeader}>
              <span>
                {selectedLocation && !isActivelyTyping
                  ? 'Selected Location'
                  : isActivelyTyping
                    ? (isGoogleLoading ? 'Searching...' : 'Search Results')
                    : ''}
              </span>
            </div>
            <ul className={styles.suggestionsList}>
              {selectedLocation && !isActivelyTyping && (
                <>
                  {renderDestinationItem(selectedLocation, true)}
                  {hasLocalResults && (
                    <div className={styles.divider}>
                      <span>Other Destinations</span>
                    </div>
                  )}
                </>
              )}

              {isActivelyTyping && hasLocalResults && (
                <>
                  <li className={styles.searchSectionLabel}>Our Destinations</li>
                  {filteredDestinations.map((destination) =>
                    renderDestinationItem(destination, false)
                  )}
                </>
              )}

              {hasGoogleResults && (
                <>
                  <li className={styles.searchSectionLabel}>
                    {isGoogleLoading ? '...' : ''}
                  </li>
                  {googlePredictions.map((prediction) => {
                    const mainText = prediction.structured_formatting?.main_text || prediction.description;
                    const secondaryText = prediction.structured_formatting?.secondary_text || '';

                    return (
                      <li
                        key={prediction.place_id}
                        className={styles.suggestionItem}
                        onClick={() => handleGoogleSelect(prediction)}
                      >
                        <SuggestionThumbnail
                          label={mainText}
                          photoUrl={photoCache[prediction.place_id]}
                        />
                        <div className={styles.suggestionContent}>
                          <span className={styles.suggestionTitle}>{mainText}</span>
                          <span className={styles.suggestionCategory}>{secondaryText}</span>
                        </div>
                      </li>
                    );
                  })}
                </>
              )}

              {isActivelyTyping && !hasLocalResults && isGoogleLoading && !hasGoogleResults && (
                <li className={styles.loadingSuggestions}>Searching locations...</li>
              )}

              {showNoResults && (
                <div className={styles.noResults}>
                  <p>No destinations found for &quot;{searchQuery}&quot;</p>
                  <small>Try a different city or country name</small>
                </div>
              )}

              {!isActivelyTyping && filteredDestinations.map((destination) =>
                renderDestinationItem(destination, false)
              )}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.datePickerWrapper} ref={calendarRef}>
        <label className={styles.searchFieldLabel}>Date</label>
        <button
          type="button"
          className={styles.datePickerButton}
          onClick={() => {
            if (!showCalendar) {
              setCalendarViewDate(selectedDate);
            }
            setShowCalendar(!showCalendar);
          }}
        >
          <BsCalendar2Date />
          <span>{moment(selectedDate).format('MMM DD, YYYY')}</span>
        </button>
        {showCalendar && (
          <div className={styles.calendarPopup}>
            <div className={styles.calendarHeader}>
              <h5 className={styles.calendarSelectedDate}>
                WHEN ARE YOU GOING?
              </h5>
            </div>
            <div className={styles.calendarBody}>
              <DatePicker
                value={selectedDate}
                date={calendarViewDate}
                onDateChange={setCalendarViewDate}
                onChange={handleDateChange}
                minDate={new Date()}
                styles={{
                  calendarHeader: {
                    maxWidth: '100%',
                  },
                  day: {
                    borderRadius: '50%',
                    height: '40px',
                    fontSize: '14px',
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.searchSubmitBtn}
        onClick={() => handleSearchSubmit(onSearchDone)}
      >
        <FaSearch />
        <span>Search</span>
      </button>
    </div>
  );

  return (
    <div className={styles.page}>
      {isLoading && <ActivityLoader />}

      {/* Desktop: hero + floating search */}
      {isDesktop && (
        <section className={styles.heroSection}>
          <div className={styles.heroImageWrap}>
            <Image
              src="/images/hero-activities-bg.jpg"
              alt="Activities"
              fill
              priority
              sizes="100vw"
              className={styles.heroImage}
              quality={75}
            />
            <div className={styles.heroOverlay} aria-hidden="true" />
            <div className={`container ${styles.heroTitleWrap}`}>
              <h1 className={styles.heroTitle}>Activities</h1>
              {/* <p className={styles.heroSubtitle}>Discover unforgettable experiences for your journey</p> */}
            </div>
          </div>
          <div className={styles.searchPanel}>
            <div className="container">
              <div className={styles.searchCard}>
                {renderSearchFields()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mobile: compact search summary */}
      {!isDesktop && (
        <div className={styles.mobileSearchWrap}>
          <div className={styles.mobileSearchBar}>
            <div
              className={styles.mobileSearchTrigger}
              onClick={() => setShowMobileSearch((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setShowMobileSearch((prev) => !prev);
              }}
            >
              <div className={styles.mobileSearchIcon}>
                <MdLocationOn size={20} />
              </div>
              <div className={styles.mobileSearchInfo}>
                <div className={styles.mobileSearchTitle}>
                  {selectedLocation?.label || searchQuery || 'Search Activities'}
                </div>
                <div className={styles.mobileSearchSubtitle}>
                  {moment(selectedDate).format('DD MMM YYYY')}
                </div>
              </div>
              <button
                type="button"
                className={styles.mobileModifyBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileSearch((prev) => !prev);
                }}
              >
                <MdEdit size={13} />
                Modify
              </button>
            </div>
          </div>
          <div
            className={`${styles.mobileSearchCollapse} ${showMobileSearch ? styles.mobileSearchCollapseOpen : ''}`}
            style={{
              maxHeight: showMobileSearch
                ? showCalendar
                  ? '920px'
                  : '640px'
                : '0',
            }}
          >
            <div className={styles.mobileSearchCollapseInner}>
              {renderSearchFields(() => setShowMobileSearch(false))}
            </div>
          </div>
        </div>
      )}

      {/* Results + left filters */}
      <section className={styles.resultsSection}>
        <div className="container">
          <div className={styles.resultsTopBar}>
            <div>
              <p className={`${styles.resultsCount} mb-0`}>
                <strong className={styles.resultsSubtext}>{isLoading ? '…' : filteredActivities.length}</strong>
                <span className={styles.resultsSubtext}>
                  {' '}{filteredActivities.length === 1 ? 'activity' : 'activities'}
                </span>
                <span className={styles.resultsSearch}> for your search</span>
              </p>
              {(searchParams.get('city') || selectedLocation?.label || searchQuery) && (
                <p className={styles.resultsCaption}>
                  Showing{' '}
                  {searchParams.get('city')
                    ? (destinations.find((d) => d.value === searchParams.get('city'))?.label
                      || humanizeSlug(searchParams.get('city')))
                    : (selectedLocation?.label || searchQuery)}{' '}
                  experiences
                </p>
              )}
            </div>
            <div className={styles.verifiedBadge}>
              <span>✓</span> All verified & insured
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-3 col-12">
              {!isLoading && (
                <FilterSection
                  activityList={activityList}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  activeFilters={activeFilters}
                  setActiveFilters={setActiveFilters}
                  currency={displayCurrency}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
              )}
            </div>

            <div className="col-md-9 col-12">
              {isLoading ? (
                <div className={styles.emptyState}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Finding amazing experiences...</p>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No experiences match your filters</p>
                </div>
              ) : (
                <div className={styles.activitiesGrid}>
                  {filteredActivities.map((item, index) => {
                    const locationText = [item.city, item.country].filter(Boolean).join(', ');
                    const activityType = formatActivityType(item.type);
                    const description = getActivityDescription(item);
                    const ratingValue = Number(item.rating_stars);

                    return (
                      <div className={styles.activityCard} key={item.id || item.slug || index}>
                        <div className={styles.cardImageWrap}>
                          <Image
                            src={item?.featured_image || item?.banner_image || '/images/placeholder.jpg'}
                            width={400}
                            height={300}
                            alt={item.title}
                            className={styles.cardImage}
                          />
                          {Number.isFinite(ratingValue) && ratingValue > 0 && (
                            <span className={styles.ratingBadge}>
                              <FaStar />
                              {ratingValue % 1 === 0 ? ratingValue.toFixed(0) : ratingValue.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className={styles.cardBody}>
                          <h3 className={styles.cardActivityTitle}>{item.title}</h3>

                          {locationText && (
                            <div className={styles.locationRow} title={locationText}>
                              <IoLocationSharp className={styles.locationIcon} />
                              <span className={styles.locationText}>{locationText}</span>
                            </div>
                          )}

                          {description && (
                            <p className={styles.cardDescription} title={description}>
                              {description}
                            </p>
                          )}

                          <div className={styles.featureTags}>
                            {item.activity_duration && (
                              <span className={styles.featureTag}>
                                <IoTimeOutline />
                                {item.activity_duration}
                              </span>
                            )}
                            {item.type && (
                              <span className={styles.featureTag}>
                                <HiTicket />
                                {activityType}
                              </span>
                            )}
                          </div>

                          <div className={styles.cardFooter}>
                            <div className={styles.priceBlock}>
                              <span className={styles.cardPriceLabel}>Per Person</span>
                              <p className={styles.cardPriceValue}>
                                <PriceDisplay price={item?.sale_price} currency={item?.currency_code} />
                              </p>
                              <span className={styles.cardPriceNote}>VAT &amp; taxes included</span>
                            </div>
                            {item.provider !== 'hotelbeds' ? (
                              <Link
                                href={`/activities/${item.slug}?from=${moment(selectedDate).format('YYYY-MM-DD')}&to=${moment(selectedDate).format('YYYY-MM-DD')}&language=en`}
                                className={styles.selectBtn}
                                onClick={() => {
                                  if (typeof window !== 'undefined') {
                                    sessionStorage.setItem(
                                      ACTIVITY_LISTING_RETURN_URL_KEY,
                                      window.location.pathname + window.location.search
                                    );
                                  }
                                }}
                              >
                                View Details
                              </Link>
                            ) : (
                              <button disabled type="button" className={styles.selectBtn}>
                                Coming Soon
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Main;
