"use client";
import { useEffect } from "react";
import { createContext, useContext, useState, useMemo } from "react";
const HotelListContext = createContext();
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";

const LANDMARKS = {
    makkah: {
        key: "makkah",
        lat: 21.4225,
        lng: 39.8262,
        filterTitle: "Distance from center of Macca",
        cardLabel: "Haram",
    },
    madinah: {
        key: "madinah",
        lat: 24.4672,
        lng: 39.6111,
        filterTitle: "Distance from Masjid Nabawi",
        cardLabel: "Masjid Nabawi",
    },
};

const DISTANCE_OPTIONS = [
    { value: "0-500", label: "0 - 500 m", minKm: 0, maxKm: 0.5 },
    { value: "500-1000", label: "500 m - 1 km", minKm: 0.5, maxKm: 1 },
    { value: "1000-2000", label: "1 - 2 km", minKm: 1, maxKm: 2 },
    { value: "2000+", label: "More than 2 km", minKm: 2, maxKm: Infinity },
];

function resolveLandmark(city, place, location) {
    const text = `${city || ""} ${place || ""} ${location || ""}`.toLowerCase();
    if (
        text.includes("makkah") ||
        text.includes("mecca") ||
        text.includes("makka")
    ) {
        return LANDMARKS.makkah;
    }
    if (
        text.includes("madinah") ||
        text.includes("medina") ||
        text.includes("madina")
    ) {
        return LANDMARKS.madinah;
    }
    return null;
}

function getHotelCoords(hotel) {
    const lat = Number(
        hotel?.location?.latitude ??
        hotel?.coordinates?.latitude ??
        hotel?.latitude ??
        hotel?.metadata?.latitude
    );
    const lng = Number(
        hotel?.location?.longitude ??
        hotel?.coordinates?.longitude ??
        hotel?.longitude ??
        hotel?.metadata?.longitude
    );
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
}

function distanceKm(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(km, cardLabel) {
    if (!Number.isFinite(km)) return "";
    if (km < 1) {
        return `${Math.round(km * 1000)} m from ${cardLabel}`;
    }
    return `${km.toFixed(2)} km from ${cardLabel}`;
}

function matchesDistanceFilter(km, selectedRanges) {
    if (!selectedRanges.length) return true;
    if (!Number.isFinite(km)) return false;
    return selectedRanges.some((value) => {
        const option = DISTANCE_OPTIONS.find((o) => o.value === value);
        if (!option) return false;
        if (option.maxKm === Infinity) return km > option.minKm;
        if (option.minKm === 0) return km >= 0 && km <= option.maxKm;
        return km > option.minKm && km <= option.maxKm;
    });
}

function getHotelPrice(hotel) {
    const converted = Number(hotel?.price);
    if (Number.isFinite(converted)) return converted;
    const raw = Number(hotel?.metadata?.min_price);
    return Number.isFinite(raw) ? raw : Number.POSITIVE_INFINITY;
}

/** Keep one hotel per name: prefer custom provider, else lowest price. */
function dedupeHotelsByName(hotels) {
    const byName = new Map();

    hotels.forEach((hotel) => {
        const key = (hotel?.name || "").trim().toLowerCase();
        if (!key) {
            byName.set(`${hotel?.id || Math.random()}`, hotel);
            return;
        }

        const existing = byName.get(key);
        if (!existing) {
            byName.set(key, hotel);
            return;
        }

        const existingIsCustom = existing?.provider === "custom";
        const hotelIsCustom = hotel?.provider === "custom";

        if (hotelIsCustom && !existingIsCustom) {
            byName.set(key, hotel);
            return;
        }
        if (existingIsCustom && !hotelIsCustom) {
            return;
        }

        if (getHotelPrice(hotel) < getHotelPrice(existing)) {
            byName.set(key, hotel);
        }
    });

    return Array.from(byName.values());
}

export function HotelListProvider({ children, hotels, place, city, location }) {
    const [convertedHotels, setConvertedHotels] = useState([]);
    const [search, setSearch] = useState(null);
    const { currency, rates } = useCurrency();
    const [star, setStar] = useState([]);
    const [hotelNames, setHotelNames] = useState([]);
    const [sort, setSort] = useState("price-asc");
    const [meal, setMeal] = useState([]);
    const [distance, setDistance] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [resetPrice, setResetPrice] = useState(0);
    const [priceRange, setPriceRange] = useState([0, 0]);
    const [visibleCount, setVisibleCount] = useState(10);
    const itemsPerPage = 10;

    const landmark = useMemo(
        () => resolveLandmark(city, place, location),
        [city, place, location]
    );

    useEffect(() => {
        setDistance([]);
    }, [landmark?.key]);

    useEffect(() => {
        if (hotels && hotels.length > 0) {
            const hotelListNew = hotels.map((item) => {
                const { newcurrency, newprice } = ConvertPrice(item.metadata?.min_price, item.metadata?.currency, currency, rates);
                let distanceFromLandmark = null;
                let distanceLabel = "";
                if (landmark) {
                    const coords = getHotelCoords(item);
                    if (coords) {
                        distanceFromLandmark = distanceKm(
                            landmark.lat,
                            landmark.lng,
                            coords.lat,
                            coords.lng
                        );
                        distanceLabel = formatDistanceLabel(
                            distanceFromLandmark,
                            landmark.cardLabel
                        );
                    }
                }
                return {
                    ...item,
                    currency: newcurrency,
                    price: newprice,
                    distanceFromLandmark,
                    distanceLabel,
                };
            });
            const uniqueHotels = dedupeHotelsByName(hotelListNew);
            const prices = uniqueHotels.map((h) => h?.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setMinPrice(min);
            setMaxPrice(max);
            setPriceRange([min, max]);
            const hotelNames = [...new Set(uniqueHotels.map((h) => h.name))];
            setHotelNames(hotelNames);
            setConvertedHotels(uniqueHotels);
        } else {
            setConvertedHotels([]);
        }
    }, [hotels, rates, currency, landmark]);

    const resetFilters = () => {
        setSearch(null);
        setStar([]);
        setMeal([]);
        setDistance([]);
        setSort("price-asc");
        setPriceRange([minPrice, maxPrice]);
        setResetPrice(resetPrice + 1);
        setVisibleCount(10);
    };


    const filteredHotels = useMemo(() => {
        let result = [...convertedHotels];
        const searchQuery = search?.trim() || "";

        // Price
        result = result.filter(
            (h) => h.price >= priceRange[0] && h.price <= priceRange[1]
        );

        // Search by name
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((h) => h.name?.toLowerCase().includes(q));
        }

        // Star Rating
        if (star.length > 0) {
            result = result.filter((h) => {
                const starValue = Math.round(Number(h.metadata?.stars));
                const isNumericStar = !isNaN(starValue) && starValue >= 1 && starValue <= 5;

                // If star includes 0 → allow hotels with non-numeric or out-of-range star values
                if (star.includes(0) && (!isNumericStar)) {
                    return true;
                }

                // Otherwise, normal 1–5 filtering
                return star.includes(starValue);
            });
        }


        // Meal
        if (meal.length > 0) {
            result = result.filter((h) =>
                h.rooms?.some((room) =>
                    room.rates?.some((rate) =>
                        meal.includes(rate.board_name.toLowerCase())
                    )
                )
            );
        }

        // Distance from landmark (Makkah / Madinah only)
        if (landmark && distance.length > 0) {
            result = result.filter((h) =>
                matchesDistanceFilter(h.distanceFromLandmark, distance)
            );
        }

        // Sort — sidebar name search or top search place: show all, best matches first
        const relevanceQuery = searchQuery || place?.trim() || "";

        if (sort === "price-asc") {
            result.sort((a, b) => a.price - b.price);
        }
        else if (sort === "price-desc") {
            result.sort((a, b) => b.price - a.price);
        }
        else if (sort === "name-asc") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }
        else if (relevanceQuery) {
            result.sort((a, b) => {
                const scoreA = getMatchScore(relevanceQuery, a.name);
                const scoreB = getMatchScore(relevanceQuery, b.name);

                if (scoreB !== scoreA) return scoreB - scoreA;

                if (a.provider === "custom" && b.provider !== "custom") return -1;
                if (a.provider !== "custom" && b.provider === "custom") return 1;

                return 0;
            });
        } else {
            if (sort === "price-asc") result.sort((a, b) => a?.price - b?.price);
            if (sort === "price-desc") result.sort((a, b) => b?.price - a?.price);
            if (sort === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [convertedHotels, search, priceRange, star, meal, distance, sort, place, landmark, minPrice, maxPrice]);

    function getMatchScore(place, hotelName) {
        if (!place || !hotelName) return 0;

        const placeLower = place.toLowerCase().trim();
        const hotelLower = hotelName.toLowerCase().trim();

        if (hotelLower === placeLower) return 100;

        if (hotelLower.includes(placeLower)) return 50 + placeLower.length;

        if (placeLower.includes(hotelLower)) return 40 + hotelLower.length;

        const placeWords = placeLower.split(/\s+/).filter(Boolean);
        const hotelWords = hotelLower.split(/\s+/);

        let score = 0;
        placeWords.forEach(word => {
            if (hotelWords.includes(word)) {
                score += 2;
            } else if (hotelLower.includes(word)) {
                score += 1;
            }
        });

        return score;
    }
    useEffect(() => {
        setVisibleCount(10);
    }, [search, star, meal, distance, priceRange, sort]);

    const visibleHotels = useMemo(() => {
        return filteredHotels.slice(0, visibleCount);
    }, [filteredHotels, visibleCount]);

    const hasMore = visibleCount < filteredHotels.length;

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + itemsPerPage, filteredHotels.length));
    };

    return (
        <HotelListContext.Provider
            value={{
                hotels: visibleHotels,
                totalHotels: filteredHotels.length,
                setSearch,
                setPriceRange,
                setStar,
                setSort,
                setMeal,
                setDistance,
                hasMore,
                loadMore,
                itemsPerPage,
                minPrice,
                maxPrice,
                sort,
                star,
                meal,
                distance,
                distanceOptions: DISTANCE_OPTIONS,
                landmark,
                search,
                priceRange,
                hotelNames,
                resetPrice,
                resetFilters,
            }}
        >
            {children}
        </HotelListContext.Provider>
    );
}

export function useHotelList() {
    return useContext(HotelListContext);
}
