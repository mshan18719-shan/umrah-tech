'use client';
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';

// Distance range string → [minMeters, maxMeters]
function parseDistanceRange(rangeStr) {
  switch (rangeStr) {
    case '0-500':     return [0, 500];
    case '500-1000':  return [500, 1000];
    case '1000-2000': return [1000, 2000];
    case '2000+':     return [2000, Infinity];
    default:          return null;
  }
}

// Parse API distance string e.g. "400 m" or "1.2 km" → metres
function parseDistanceStringToMeters(distanceStr) {
  if (!distanceStr) return null;
  const match = distanceStr.match(/([\d.]+)\s*(m|km)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return match[2].toLowerCase() === 'km' ? Math.round(value * 1000) : Math.round(value);
}

const FilterContext = createContext();

export function FilterProvider({ children, packages }) {
  // Price filters
  const [priceType, setPriceTypeState] = useState('pp'); // 'total' or 'pp' (per person)
  const priceTypeRef = useRef(priceType);
  priceTypeRef.current = priceType;
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [currency, setCurrency] = useState('');

  // Makkah Hotel filters
  const [makkahHotelSearch, setMakkahHotelSearch] = useState('');
  const [makkahRatings, setMakkahRatings] = useState([]);
  const [makkahHaramView, setMakkahHaramView] = useState(false);
  const [makkahKaabaView, setMakkahKaabaView] = useState(false);
  const [makkahHotelNames, setMakkahHotelNames] = useState([]);
  const [makkahDistances, setMakkahDistances] = useState([]);

  // Madinah Hotel filters
  const [madinahHotelSearch, setMadinahHotelSearch] = useState('');
  const [madinahRatings, setMadinahRatings] = useState([]);
  const [madinahHaramView, setMadinahHaramView] = useState(false);
  const [madinahHotelNames, setMadinahHotelNames] = useState([]);
  const [madinahDistances, setMadinahDistances] = useState([]);

  // Sorting
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'nearest_makkah' | 'nearest_madinah' | 'price_asc' | 'price_desc'

  // Distance cache keyed by hotel id.
  // Each entry: { loading: true } | { loading: false, distance, walking, difficulty, distanceMeters } | { loading: false, error: true }
  const [googleDistanceCache, setGoogleDistanceCache] = useState({});

  /**
   * Fetch distance for a single hotel and immediately update its cache entry.
   * All hotels fire concurrently — each card updates as its own response arrives.
   */
  const fetchSingleDistance = useCallback(async ({ id, hotel, city, lat, lon }) => {
    // Mark this hotel as loading
    setGoogleDistanceCache(prev => {
      if (prev[id]) return prev; // already in-flight or resolved
      return { ...prev, [id]: { loading: true } };
    });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL}/api/bulk-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.NEXT_PUBLIC_AI_API_TOKEN },
        body: JSON.stringify({ hotel, city, lat, lon }),
      });
      const r = await res.json();

      setGoogleDistanceCache(prev => ({
        ...prev,
        [id]: (r && !r.error)
          ? {
              loading: false,
              distance: r.distance,
              walking: r.walking,
              difficulty: r.difficulty,
              distanceMeters: parseDistanceStringToMeters(r.distance),
            }
          : { loading: false, error: true },
      }));
    } catch {
      setGoogleDistanceCache(prev => ({ ...prev, [id]: { loading: false, error: true } }));
    }
  }, []);

  // Fire one request per unique hotel concurrently — results appear as they arrive
  useEffect(() => {
    if (!packages?.length) return;
    const seen = new Set();
    packages.forEach(pkg => {
      const mh = pkg?.makkah_hotel;
      if (mh?.id && mh?.name && !seen.has(mh.id)) {
        seen.add(mh.id);
        const mhLabel = [mh.name, mh?.location?.address].filter(Boolean).join(', ');
        fetchSingleDistance({ id: mh.id, hotel: mhLabel, city: 'makkah', lat: mh?.location?.latitude, lon: mh?.location?.longitude });
      }
      const mdh = pkg?.madinah_hotel;
      if (mdh?.id && mdh?.name && !seen.has(mdh.id)) {
        seen.add(mdh.id);
        const mdhLabel = [mdh.name, mdh?.location?.address].filter(Boolean).join(', ');
        fetchSingleDistance({ id: mdh.id, hotel: mdhLabel, city: 'madinah', lat: mdh?.location?.latitude, lon: mdh?.location?.longitude });
      }
    });
  }, [packages, fetchSingleDistance]);

  const applyPriceBounds = useCallback((type, pkgList) => {
    if (!pkgList?.length) return;
    const prices = pkgList.map(pkg =>
      type === 'total' ? pkg.total_price : pkg.price_per_person
    );
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    setCurrency(pkgList[0].currency || '');
    setMinPrice(min);
    setMaxPrice(max);
    setPriceRange([min, max]);
  }, []);

  // Batch price-type + bounds in one render (avoids mismatched filter → card unmount → API refetch)
  const handlePriceTypeChange = useCallback((type) => {
    setPriceTypeState(type);
    applyPriceBounds(type, packages);
  }, [packages, applyPriceBounds]);

  // Initialize price range and hotel names when packages load
  useEffect(() => {
    if (packages && packages.length > 0) {
      applyPriceBounds(priceTypeRef.current, packages);

      const makkahNames = [...new Set(packages.map(pkg => pkg.makkah_hotel?.name).filter(Boolean))];
      const madinahNames = [...new Set(packages.map(pkg => pkg.madinah_hotel?.name).filter(Boolean))];

      setMakkahHotelNames(makkahNames);
      setMadinahHotelNames(madinahNames);
    }
  }, [packages, applyPriceBounds]);

  // Reset filters function
  const resetFilters = () => {
    setPriceRange([minPrice, maxPrice]);
    setMakkahHotelSearch('');
    setMakkahRatings([]);
    setMakkahHaramView(false);
    setMakkahKaabaView(false);
    setMakkahDistances([]);
    setMadinahHotelSearch('');
    setMadinahRatings([]);
    setMadinahHaramView(false);
    setMadinahDistances([]);
    setSortBy('default');
  };

  // Filtering logic
  const filteredPackages = useMemo(() => {
    if (!packages || packages.length === 0) return [];

    let result = [...packages];

    // Price filter
    result = result.filter(pkg => {
      const price = priceType === 'total' ? pkg.total_price : pkg.price_per_person;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Makkah Hotel Name Search
    if (makkahHotelSearch.trim() !== '') {
      result = result.filter(pkg =>
        pkg.makkah_hotel?.name?.toLowerCase().includes(makkahHotelSearch.toLowerCase())
      );
    }

    // Makkah Star Rating
    if (makkahRatings.length > 0) {
      debugger
      result = result.filter(pkg => {
        debugger
        const starValue = Number(pkg.makkah_hotel?.star_rating || 0);
        const isNumericStar = !isNaN(starValue) && starValue > 0;

        // allow unrated hotels if 0 selected
        if (makkahRatings.includes(0) && !isNumericStar) {
          return true;
        }

        // ⭐ show hotels with rating >= selected rating
        return makkahRatings.some(rating => isNumericStar && starValue === rating);
      });
    }


    // Makkah Haram View
    if (makkahHaramView) {
      result = result.filter(pkg => pkg.makkah_hotel?.haram_view === true);
    }

    // Makkah Kaaba View
    if (makkahKaabaView) {
      result = result.filter(pkg => pkg.makkah_hotel?.kaaba_view === true);
    }

    // Madinah Hotel Name Search
    if (madinahHotelSearch.trim() !== '') {
      result = result.filter(pkg =>
        pkg.madinah_hotel?.name?.toLowerCase().includes(madinahHotelSearch.toLowerCase())
      );
    }

    // Madinah Star Rating
    if (madinahRatings.length > 0) {
      result = result.filter(pkg => {
        const starValue = Number(pkg.madinah_hotel?.star_rating || 0);
        const isNumericStar = !isNaN(starValue) && starValue > 0;

        // allow unrated hotels if 0 selected
        if (madinahRatings.includes(0) && !isNumericStar) {
          return true;
        }

        // ⭐ show hotels with rating >= selected rating
        return madinahRatings.some(rating => isNumericStar && starValue === rating);
      });
    }

    // Madinah Haram View
    if (madinahHaramView) {
      result = result.filter(pkg => pkg.madinah_hotel?.haram_view === true);
    }

    // --- Makkah distance filter (Google only; pass-through while still loading) ---
    if (makkahDistances.length > 0) {
      result = result.filter(pkg => {
        const dist = googleDistanceCache[pkg.makkah_hotel?.id];
        if (!dist || dist.loading) return true; // still fetching — keep visible
        if (dist.error) return makkahDistances.includes('unknown');
        return makkahDistances.some(rangeStr => {
          const range = parseDistanceRange(rangeStr);
          return range && dist.distanceMeters >= range[0] && dist.distanceMeters <= range[1];
        });
      });
    }

    // --- Madinah distance filter (Google only; pass-through while still loading) ---
    if (madinahDistances.length > 0) {
      result = result.filter(pkg => {
        const dist = googleDistanceCache[pkg.madinah_hotel?.id];
        if (!dist || dist.loading) return true; // still fetching — keep visible
        if (dist.error) return madinahDistances.includes('unknown');
        return madinahDistances.some(rangeStr => {
          const range = parseDistanceRange(rangeStr);
          return range && dist.distanceMeters >= range[0] && dist.distanceMeters <= range[1];
        });
      });
    }

    // --- Sorting ---
    if (sortBy === 'nearest_makkah') {
      result = [...result].sort((a, b) => {
        const da = googleDistanceCache[a.makkah_hotel?.id];
        const db = googleDistanceCache[b.makkah_hotel?.id];
        const ma = (da && !da.loading && !da.error) ? da.distanceMeters : Infinity;
        const mb = (db && !db.loading && !db.error) ? db.distanceMeters : Infinity;
        return ma - mb;
      });
    } else if (sortBy === 'nearest_madinah') {
      result = [...result].sort((a, b) => {
        const da = googleDistanceCache[a.madinah_hotel?.id];
        const db = googleDistanceCache[b.madinah_hotel?.id];
        const ma = (da && !da.loading && !da.error) ? da.distanceMeters : Infinity;
        const mb = (db && !db.loading && !db.error) ? db.distanceMeters : Infinity;
        return ma - mb;
      });
    } else if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => {
        const pa = priceType === 'total' ? a.total_price : a.price_per_person;
        const pb = priceType === 'total' ? b.total_price : b.price_per_person;
        return pa - pb;
      });
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => {
        const pa = priceType === 'total' ? a.total_price : a.price_per_person;
        const pb = priceType === 'total' ? b.total_price : b.price_per_person;
        return pb - pa;
      });
    }

    return result;
  }, [
    packages,
    priceType,
    priceRange,
    makkahHotelSearch,
    makkahRatings,
    makkahHaramView,
    makkahKaabaView,
    makkahDistances,
    madinahHotelSearch,
    madinahRatings,
    madinahHaramView,
    madinahDistances,
    sortBy,
    googleDistanceCache,
  ]);

  const value = {
    // Price
    priceType,
    setPriceType: handlePriceTypeChange,
    minPrice,
    maxPrice,
    priceRange,
    setPriceRange,
    currency,

    // Makkah filters
    makkahHotelSearch,
    setMakkahHotelSearch,
    makkahRatings,
    setMakkahRatings,
    makkahHaramView,
    setMakkahHaramView,
    makkahKaabaView,
    setMakkahKaabaView,
    makkahHotelNames,
    makkahDistances,
    setMakkahDistances,

    // Madinah filters
    madinahHotelSearch,
    setMadinahHotelSearch,
    madinahRatings,
    setMadinahRatings,
    madinahHaramView,
    setMadinahHaramView,
    madinahHotelNames,
    madinahDistances,
    setMadinahDistances,

    // Sorting
    sortBy,
    setSortBy,

    // Google Distance Matrix cache (shared with ListingCard for display)
    googleDistanceCache,
    fetchSingleDistance,

    // Filtered data
    filteredPackages,

    // Actions
    resetFilters
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
