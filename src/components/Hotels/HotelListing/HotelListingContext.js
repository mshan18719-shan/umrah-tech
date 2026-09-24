"use client";
import { useEffect, useCallback, useRef, createContext, useContext, useState, useMemo } from "react";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";

const HotelListContext = createContext();

const LANDMARKS = {
    makkah: {
        key: "makkah",
        city: "makkah",
        filterTitle: "Distance from Masjid al-Haram",
        cardLabel: "Masjid al-Haram",
    },
    madinah: {
        key: "madinah",
        city: "madinah",
        filterTitle: "Distance from Al-Masjid an-Nabawi",
        cardLabel: "Al-Masjid an-Nabawi",
    },
};

const DISTANCE_OPTIONS = [
    { value: "0-500", label: "0–500 m", minMeters: 0, maxMeters: 500 },
    { value: "500-1000", label: "500 m – 1 km", minMeters: 500, maxMeters: 1000 },
    { value: "1000-2000", label: "1–2 km", minMeters: 1000, maxMeters: 2000 },
    { value: "2000+", label: "More than 2 km", minMeters: 2000, maxMeters: Infinity },
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

function parseDistanceStringToMeters(distanceStr) {
    if (!distanceStr) return null;
    const match = String(distanceStr).match(/([\d.]+)\s*(m|km)/i);
    if (!match) return null;
    const value = parseFloat(match[1]);
    return match[2].toLowerCase() === "km" ? Math.round(value * 1000) : Math.round(value);
}

function matchesDistanceFilter(meters, selectedRanges) {
    if (!selectedRanges.length) return true;
    if (!Number.isFinite(meters)) return false;
    return selectedRanges.some((value) => {
        const option = DISTANCE_OPTIONS.find((o) => o.value === value);
        if (!option) return false;
        if (option.maxMeters === Infinity) return meters > option.minMeters;
        if (option.minMeters === 0) return meters >= 0 && meters <= option.maxMeters;
        return meters > option.minMeters && meters <= option.maxMeters;
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
            byName.set(`${hotel?.provider || ''}:${hotel?.id || Math.random()}`, hotel);
            return;
        }

        const existing = byName.get(key);
        if (!existing) {
            byName.set(key, hotel);
            return;
        }

        const existingIsCustom = String(existing?.provider || "").toLowerCase() === "custom";
        const hotelIsCustom = String(hotel?.provider || "").toLowerCase() === "custom";

        // Prefer custom over any other provider
        if (hotelIsCustom && !existingIsCustom) {
            byName.set(key, hotel);
            return;
        }
        if (existingIsCustom && !hotelIsCustom) {
            return;
        }

        // Same provider type (both custom or both non-custom): keep lowest price
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
    const [sort, setSort] = useState("recommended");
    const [meal, setMeal] = useState([]);
    const [distance, setDistance] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [resetPrice, setResetPrice] = useState(0);
    const [priceRange, setPriceRange] = useState([0, 0]);
    const [visibleCount, setVisibleCount] = useState(10);
    const [distanceCache, setDistanceCache] = useState({});
    const itemsPerPage = 10;
    const prevCurrencyRef = useRef(currency);

    const landmark = useMemo(
        () => resolveLandmark(city, place, location),
        [city, place, location]
    );

    useEffect(() => {
        setDistance([]);
        setDistanceCache({});
    }, [landmark?.key]);

    const fetchSingleDistance = useCallback(async ({ id, hotel, cityKey, lat, lon }) => {
        let skip = false;
        setDistanceCache((prev) => {
            if (prev[id]) {
                skip = true;
                return prev;
            }
            return { ...prev, [id]: { loading: true } };
        });
        if (skip) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL}/api/bulk-route`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": process.env.NEXT_PUBLIC_AI_API_TOKEN,
                },
                body: JSON.stringify({ hotel, city: cityKey, lat, lon }),
            });
            const r = await res.json();

            setDistanceCache((prev) => ({
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
            setDistanceCache((prev) => ({
                ...prev,
                [id]: { loading: false, error: true },
            }));
        }
    }, []);

    useEffect(() => {
        if (hotels && hotels.length > 0) {
            const currencyChanged = prevCurrencyRef.current !== currency;
            prevCurrencyRef.current = currency;

            const hotelListNew = hotels.map((item) => {
                const { newcurrency, newprice } = ConvertPrice(
                    item.metadata?.min_price,
                    item.metadata?.currency,
                    currency,
                    rates
                );
                const numericPrice = Number(newprice);
                return {
                    ...item,
                    currency: newcurrency,
                    price: Number.isFinite(numericPrice)
                        ? numericPrice
                        : Number(item.metadata?.min_price) || 0,
                };
            });
            const uniqueHotels = dedupeHotelsByName(hotelListNew);
            const prices = uniqueHotels
                .map((h) => Number(h?.price))
                .filter((p) => Number.isFinite(p));
            const min = prices.length ? Math.min(...prices) : 0;
            const max = prices.length ? Math.max(...prices) : 0;

            setConvertedHotels(uniqueHotels);
            setHotelNames([...new Set(uniqueHotels.map((h) => h.name))]);

            // Streaming: expand bounds; keep user range unless it was the full previous span.
            // Always reset when currency changes so GBP/USD don't keep a stale [0,0] / old range.
            setPriceRange((prev) => {
                if (currencyChanged) return [min, max];

                const wasUnset = prev[0] === 0 && prev[1] === 0;
                const wasFullRange =
                    Number.isFinite(minPrice) &&
                    Number.isFinite(maxPrice) &&
                    Math.abs(prev[0] - minPrice) < 0.01 &&
                    Math.abs(prev[1] - maxPrice) < 0.01;

                if (wasUnset || wasFullRange || (minPrice === 0 && maxPrice === 0)) {
                    return [min, max];
                }
                return [
                    Math.max(min, Math.min(prev[0], max)),
                    Math.min(max, Math.max(prev[1], min)),
                ];
            });
            setMinPrice(min);
            setMaxPrice(max);
        } else {
            setConvertedHotels([]);
        }
    }, [hotels, rates, currency]);

    // Fetch landmark distances via bulk-route (Makkah / Madinah only)
    useEffect(() => {
        if (!landmark || !convertedHotels.length) return;

        const seen = new Set();
        convertedHotels.forEach((hotel) => {
            if (!hotel?.id || !hotel?.name || seen.has(hotel.id)) return;
            seen.add(hotel.id);

            const coords = getHotelCoords(hotel);
            const address =
                hotel?.location?.address
                || hotel?.address
                || hotel?.metadata?.address
                || "";
            const hotelLabel = [hotel.name, address].filter(Boolean).join(", ");

            fetchSingleDistance({
                id: hotel.id,
                hotel: hotelLabel,
                cityKey: landmark.city,
                lat: coords?.lat ?? null,
                lon: coords?.lng ?? null,
            });
        });
    }, [convertedHotels, landmark, fetchSingleDistance]);

    const resetFilters = () => {
        setSearch(null);
        setStar([]);
        setMeal([]);
        setDistance([]);
        setSort("recommended");
        setPriceRange([minPrice, maxPrice]);
        setResetPrice(resetPrice + 1);
        setVisibleCount(10);
    };

    const resetPriceRange = useCallback(() => {
        setPriceRange([minPrice, maxPrice]);
        setResetPrice((prev) => prev + 1);
    }, [minPrice, maxPrice]);

    const filteredHotels = useMemo(() => {
        let result = [...convertedHotels];
        const searchQuery = search?.trim() || "";

        // Attach bulk-route distance for card display (Makkah / Madinah only)
        if (landmark) {
            result = result.map((h) => {
                const dist = distanceCache[h.id];
                if (dist && !dist.loading && !dist.error && dist.distance) {
                    return {
                        ...h,
                        distanceFromLandmark: dist.distanceMeters,
                        distanceLabel: `${dist.distance} from ${landmark.cardLabel}`,
                    };
                }
                return {
                    ...h,
                    distanceFromLandmark: null,
                    distanceLabel: "",
                };
            });
        }

        // Price — skip filter when range is unset/degenerate so cards don't vanish
        const rangeMin = Number(priceRange[0]);
        const rangeMax = Number(priceRange[1]);
        const hasValidPriceRange =
            Number.isFinite(rangeMin) &&
            Number.isFinite(rangeMax) &&
            !(rangeMin === 0 && rangeMax === 0);
        if (hasValidPriceRange) {
            result = result.filter((h) => {
                const price = Number(h.price);
                if (!Number.isFinite(price)) return true;
                return price >= rangeMin && price <= rangeMax;
            });
        }

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

                if (star.includes(0) && (!isNumericStar)) {
                    return true;
                }

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

        // Distance from landmark (Makkah / Madinah only) — pass-through while loading
        if (landmark && distance.length > 0) {
            result = result.filter((h) => {
                const dist = distanceCache[h.id];
                if (!dist || dist.loading) return true;
                if (dist.error) return false;
                return matchesDistanceFilter(dist.distanceMeters, distance);
            });
        }

        // Sort — sidebar name search or top search place: show all, best matches first
        const relevanceQuery = searchQuery || place?.trim() || "";

        if (sort === "price-asc") {
            result.sort((a, b) => a.price - b.price);
        } else if (sort === "price-desc") {
            result.sort((a, b) => b.price - a.price);
        } else if (sort === "name-asc") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // recommended (default): name relevance → custom provider → price
            result.sort((a, b) => {
                if (relevanceQuery) {
                    const scoreA = getMatchScore(relevanceQuery, a.name);
                    const scoreB = getMatchScore(relevanceQuery, b.name);
                    if (scoreB !== scoreA) return scoreB - scoreA;
                }

                if (a.provider === "custom" && b.provider !== "custom") return -1;
                if (a.provider !== "custom" && b.provider === "custom") return 1;

                return (a.price ?? Infinity) - (b.price ?? Infinity);
            });
        }

        return result;
    }, [
        convertedHotels,
        search,
        priceRange,
        star,
        meal,
        distance,
        sort,
        place,
        landmark,
        distanceCache,
        minPrice,
        maxPrice,
    ]);

    function getMatchScore(placeName, hotelName) {
        if (!placeName || !hotelName) return 0;

        const placeLower = placeName.toLowerCase().trim();
        const hotelLower = hotelName.toLowerCase().trim();

        if (hotelLower === placeLower) return 100;

        if (hotelLower.includes(placeLower)) return 50 + placeLower.length;

        if (placeLower.includes(hotelLower)) return 40 + hotelLower.length;

        const placeWords = placeLower.split(/\s+/).filter(Boolean);
        const hotelWords = hotelLower.split(/\s+/);

        let score = 0;
        placeWords.forEach((word) => {
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
        setVisibleCount((prev) => Math.min(prev + itemsPerPage, filteredHotels.length));
    };

    return (
        <HotelListContext.Provider
            value={{
                hotels: visibleHotels,
                filteredHotels,
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
                distances: distance,
                setDistances: setDistance,
                distanceOptions: DISTANCE_OPTIONS,
                landmark,
                showDistance: Boolean(landmark),
                distanceLandmarkLabel: landmark ? `from ${landmark.cardLabel}` : '',
                distanceCache,
                search,
                priceRange,
                hotelNames,
                resetPrice,
                resetPriceRange,
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
