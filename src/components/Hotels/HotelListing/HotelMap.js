"use client";

import { GoogleMap, LoadScriptNext, Marker } from "@react-google-maps/api";
import { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useRef, useCallback, memo } from "react";
import { Modal, Autocomplete } from "@mantine/core";
import { FaStar, FaCheck } from "react-icons/fa";
import { MdMap, MdClose } from "react-icons/md";
import { IoLocationSharp } from "react-icons/io5";
import { LiaAngleDownSolid, LiaAngleUpSolid } from "react-icons/lia";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/util/currency";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { useHotelList } from "./HotelListingContext";
import PriceRange from "./Filters/PriceRange";
import StarFilter from "./Filters/StarFilter";
import MealType from "./Filters/MealType";
import SortOption from "./Filters/SortOption";
import DistanceFilter from "./Filters/DistanceFilter";
import styles from "./HotelMap.module.css";

const BRAND_PRIMARY = "#02245E";
const BRAND_PRIMARY_DARK = "#011a45";
const BRAND_ACCENT = "#c9a227";
const BRAND_INK = "#f3ead2";
const BRAND_MUTED_SURFACE = "#ffffff";
/** Squared capsule — less “Booking bubble”, more atlas ticket */
const PRICE_MARKER_PATH =
    "M8,0 h72 a8,8 0 0 1 8,8 v16 a8,8 0 0 1 -8,8 h-72 a8,8 0 0 1 -8,-8 v-16 a8,8 0 0 1 8,-8 z";
/** Soft cap before clustering kicks in on huge result sets */
const MAX_PRICE_MARKERS = 200;
/** Below this zoom (and only for huge sets), prefer clustered count pins */
const CLUSTER_ZOOM = 12;

const hotelKey = (hotel) =>
    hotel ? `${hotel.id}-${hotel.provider}` : "";

function parseCoord(value) {
    if (value == null || value === "") return NaN;
    if (typeof value === "object") {
        return Number(value.lat ?? value.latitude ?? value.lng ?? value.longitude ?? value.lon);
    }
    return Number(String(value).trim());
}

function isValidLatLng(lat, lng) {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        !(lat === 0 && lng === 0) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
    );
}

function coordDistanceSq(a, b) {
    if (!a || !b) return Number.POSITIVE_INFINITY;
    const dLat = a.lat - b.lat;
    const dLng = a.lng - b.lng;
    return dLat * dLat + dLng * dLng;
}

/** Prefer orientation closest to search center (fixes [lat,lng] vs GeoJSON [lng,lat]). */
function pickOrientation(latA, lngA, latB, lngB, centerHint) {
    const direct = isValidLatLng(latA, lngA) ? { lat: latA, lng: lngA } : null;
    const swapped = isValidLatLng(latB, lngB) ? { lat: latB, lng: lngB } : null;
    if (direct && swapped && centerHint) {
        return coordDistanceSq(direct, centerHint) <= coordDistanceSq(swapped, centerHint)
            ? direct
            : swapped;
    }
    return direct || swapped;
}

function getHotelCoords(hotel, centerHint = null) {
    const candidates = [
        hotel?.location,
        hotel?.coordinates,
        hotel?.geo,
        hotel?.geolocation,
        hotel?.GeoLocation,
        hotel?.geoLocation,
        hotel?.geo_location,
        hotel?.metadata?.location,
        hotel?.metadata?.coordinates,
        hotel?.metadata,
        hotel,
    ];

    for (const source of candidates) {
        if (source == null) continue;

        if (typeof source === "string" && source.includes(",")) {
            const parts = source.split(",").map((part) => Number(String(part).trim()));
            if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
                const picked = pickOrientation(
                    parts[0],
                    parts[1],
                    parts[1],
                    parts[0],
                    centerHint
                );
                if (picked) return picked;
            }
            continue;
        }

        if (!source || typeof source !== "object") continue;

        const arr = source.coordinates ?? source.coords;
        if (Array.isArray(arr) && arr.length >= 2) {
            const a = Number(arr[0]);
            const b = Number(arr[1]);
            if (Number.isFinite(a) && Number.isFinite(b) && !(a === 0 && b === 0)) {
                // Hotel APIs usually [lat,lng]; GeoJSON is [lng,lat] — pick nearer to search center
                const asLatLng = pickOrientation(a, b, b, a, centerHint);
                if (asLatLng) return asLatLng;
            }
        }

        const lat = parseCoord(
            source.latitude ?? source.lat ?? source.Latitude ?? source.Lat
        );
        const lng = parseCoord(
            source.longitude ?? source.lng ?? source.lon ?? source.Longitude ?? source.Lng ?? source.Lon
        );
        if (isValidLatLng(lat, lng)) {
            // If values look swapped vs destination, correct them
            if (centerHint && Math.abs(lng) <= 90) {
                const swapped = { lat: lng, lng: lat };
                if (
                    isValidLatLng(swapped.lat, swapped.lng) &&
                    coordDistanceSq(swapped, centerHint) + 0.15 <
                        coordDistanceSq({ lat, lng }, centerHint)
                ) {
                    return swapped;
                }
            }
            return { lat, lng };
        }
    }

    return null;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function geocodeAddress(geocoder, address, options = {}) {
    return new Promise((resolve) => {
        if (!geocoder || !address) {
            resolve(null);
            return;
        }
        geocoder.geocode({ address, ...options }, (results, status) => {
            if (status === "OK" && results?.[0]?.geometry?.location) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
                return;
            }
            resolve(status === "OVER_QUERY_LIMIT" ? "OVER_QUERY_LIMIT" : null);
        });
    });
}

const GEO_CACHE_PREFIX = "hotelMapGeo:";

function readGeoCache(key) {
    if (typeof window === "undefined" || !key) return null;
    try {
        const raw = sessionStorage.getItem(GEO_CACHE_PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const lat = Number(parsed?.lat);
        const lng = Number(parsed?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
    } catch {
        return null;
    }
}

function writeGeoCache(key, coords) {
    if (typeof window === "undefined" || !key || !coords) return;
    try {
        sessionStorage.setItem(
            GEO_CACHE_PREFIX + key,
            JSON.stringify({ lat: coords.lat, lng: coords.lng })
        );
    } catch {
        /* quota / private mode */
    }
}

function buildHotelGeocodeQueries(hotel, placeLabel, countryLabel) {
    const name = (hotel?.name || "").trim();
    const address = (
        hotel?.location?.address ||
        hotel?.address ||
        hotel?.metadata?.address ||
        ""
    ).trim();
    const destination = [placeLabel, countryLabel].filter(Boolean).join(", ");
    const queries = [];
    const push = (q) => {
        const cleaned = String(q || "").replace(/\s+/g, " ").trim();
        if (cleaned && !queries.includes(cleaned)) queries.push(cleaned);
    };

    if (name && destination) push(`${name}, ${destination}`);
    if (name) push(`${name} hotel, ${destination || placeLabel || ""}`);
    if (address && destination) push(`${address}, ${destination}`);
    if (address) push(address);
    if (name && placeLabel) push(`${name}, ${placeLabel}`);
    if (name) push(name);

    return queries;
}

/** Places Autocomplete → Details (primary path for missing hotel coords) */
async function resolveViaPlacesApi(query) {
    if (!query) return null;
    try {
        const tryAutocomplete = async (withTypes) => {
            const url = withTypes
                ? `/api/places/autocomplete?input=${encodeURIComponent(query)}&types=establishment`
                : `/api/places/autocomplete?input=${encodeURIComponent(query)}`;
            const acRes = await fetch(url);
            const acData = await acRes.json();
            return acData?.predictions?.[0]?.place_id || null;
        };

        let placeId = await tryAutocomplete(true);
        if (!placeId) placeId = await tryAutocomplete(false);
        if (!placeId) return null;

        const detRes = await fetch(
            `/api/places/details?place_id=${encodeURIComponent(placeId)}`
        );
        const detData = await detRes.json();
        const loc = detData?.result?.geometry?.location;
        const lat = Number(loc?.lat);
        const lng = Number(loc?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
    } catch {
        return null;
    }
}

const getGridCellSize = (zoom) => {
    if (zoom <= 10) return 0.1;
    if (zoom <= 11) return 0.05;
    if (zoom <= 12) return 0.025;
    if (zoom <= 13) return 0.012;
    if (zoom <= 14) return 0.006;
    return 0.003;
};

let cachedPriceIconActive = null;
let cachedPriceIconInactive = null;
let cachedClusterIcon = null;
let cachedIconTheme = null;
const MARKER_THEME_KEY = `${BRAND_PRIMARY}|${BRAND_ACCENT}|navy-ticket-v4`;

const invalidateMarkerIconCacheIfNeeded = () => {
    if (cachedIconTheme === MARKER_THEME_KEY) return;
    cachedPriceIconActive = null;
    cachedPriceIconInactive = null;
    cachedClusterIcon = null;
    cachedIconTheme = MARKER_THEME_KEY;
};

const getPriceMarkerIcon = (isActive) => {
    if (typeof window === "undefined" || !window.google?.maps) return undefined;
    invalidateMarkerIconCacheIfNeeded();
    if (isActive) {
        if (!cachedPriceIconActive) {
            cachedPriceIconActive = {
                path: PRICE_MARKER_PATH,
                fillColor: BRAND_ACCENT,
                fillOpacity: 1,
                strokeWeight: 1.5,
                strokeColor: BRAND_PRIMARY_DARK,
                scale: 1.08,
                anchor: new window.google.maps.Point(44, 18),
                labelOrigin: new window.google.maps.Point(44, 16),
            };
        }
        return cachedPriceIconActive;
    }
    if (!cachedPriceIconInactive) {
        cachedPriceIconInactive = {
            path: PRICE_MARKER_PATH,
            fillColor: BRAND_PRIMARY,
            fillOpacity: 1,
            strokeWeight: 1.25,
            strokeColor: BRAND_ACCENT,
            scale: 1,
            anchor: new window.google.maps.Point(44, 16),
            labelOrigin: new window.google.maps.Point(44, 16),
        };
    }
    return cachedPriceIconInactive;
};

const getClusterMarkerIcon = () => {
    if (typeof window === "undefined" || !window.google?.maps) return undefined;
    invalidateMarkerIconCacheIfNeeded();
    if (!cachedClusterIcon) {
        cachedClusterIcon = {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 20,
            fillColor: BRAND_PRIMARY,
            fillOpacity: 0.96,
            strokeWeight: 3,
            strokeColor: BRAND_ACCENT,
            labelOrigin: new window.google.maps.Point(0, 0),
        };
    }
    return cachedClusterIcon;
};

function isInsideMantineOverlay(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(
        target.closest("[data-portal]") ||
            target.closest(".mantine-Combobox-dropdown") ||
            target.closest(".mantine-Popover-dropdown") ||
            target.closest(".mantine-Autocomplete-dropdown") ||
            target.closest(".mantine-Select-dropdown")
    );
}

/**
 * Show ALL price pills for typical result sizes.
 * Only cluster/cap when the set is huge.
 */
const buildViewportMarkers = (mapHotels, bounds, zoom, selectedKey) => {
    // Always render every pill when within soft cap — user zooms to inspect
    if (mapHotels.length <= MAX_PRICE_MARKERS) {
        const pinned = [];
        const rest = [];
        for (const m of mapHotels) {
            if (selectedKey && m.key === selectedKey) {
                pinned.push({ type: "hotel", ...m });
            } else {
                rest.push({ type: "hotel", ...m });
            }
        }
        return [...pinned, ...rest];
    }

    let candidates = mapHotels;

    if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latPad = Math.max((ne.lat() - sw.lat()) * 0.15, 0.002);
        const lngPad = Math.max((ne.lng() - sw.lng()) * 0.15, 0.002);
        const minLat = sw.lat() - latPad;
        const maxLat = ne.lat() + latPad;
        const minLng = sw.lng() - lngPad;
        const maxLng = ne.lng() + lngPad;

        candidates = mapHotels.filter(
            ({ position }) =>
                position.lat >= minLat &&
                position.lat <= maxLat &&
                position.lng >= minLng &&
                position.lng <= maxLng
        );
    } else {
        candidates = mapHotels.slice(0, MAX_PRICE_MARKERS);
    }

    const pinned = [];
    if (selectedKey) {
        for (const m of mapHotels) {
            if (m.key === selectedKey) {
                pinned.push({ type: "hotel", ...m });
                break;
            }
        }
    }

    if (zoom < CLUSTER_ZOOM) {
        const cell = getGridCellSize(zoom);
        const grid = new Map();

        for (const m of candidates) {
            if (selectedKey && m.key === selectedKey) continue;
            const gx = Math.floor(m.position.lat / cell);
            const gy = Math.floor(m.position.lng / cell);
            const gkey = `${gx}:${gy}`;
            let group = grid.get(gkey);
            if (!group) {
                group = [];
                grid.set(gkey, group);
            }
            group.push(m);
        }

        const result = [...pinned];

        for (const group of grid.values()) {
            if (group.length === 1) {
                result.push({ type: "hotel", ...group[0] });
                continue;
            }

            let lat = 0;
            let lng = 0;
            for (const m of group) {
                lat += m.position.lat;
                lng += m.position.lng;
            }
            result.push({
                type: "cluster",
                id: `cluster-${group[0].key}-${group.length}`,
                count: group.length,
                position: {
                    lat: lat / group.length,
                    lng: lng / group.length,
                },
            });
        }

        return result;
    }

    const seen = new Set(pinned.map((p) => p.key));
    let rest = candidates.filter((m) => !seen.has(m.key));

    if (rest.length > MAX_PRICE_MARKERS - pinned.length) {
        rest = [...rest]
            .sort((a, b) => {
                const pa = Number(a.hotel?.metadata?.min_price) || 0;
                const pb = Number(b.hotel?.metadata?.min_price) || 0;
                return pa - pb;
            })
            .slice(0, Math.max(0, MAX_PRICE_MARKERS - pinned.length));
    }

    return [...pinned, ...rest.map((m) => ({ type: "hotel", ...m }))];
};

const encodeProvider = (str) => {
    return [...str].map((c) => (c.charCodeAt(0) + 3).toString(36)).join("");
};

const getProviderCode = (provider) => {
    if (!provider) return "";
    return encodeProvider(provider).toLowerCase();
};

const makingSlug = (name) => {
    return name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
};

const formatPrice = (price) => {
    const value = Number(price);
    if (!Number.isFinite(value)) return "0";
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

const normalizeImageSrc = (raw) => {
    if (!raw) return "/images/hotelloadimg.jpg";
    if (raw.startsWith("data:") || raw.startsWith("/")) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("//")) {
        if (typeof window !== "undefined") return window.location.protocol + raw;
        return "https:" + raw;
    }
    return "http://" + raw.replace(/^\/+/, "");
};

const hasFreeCancellation = (hotel) => {
    if (!hotel?.rooms?.length) return false;
    const now = moment.utc();
    for (const room of hotel.rooms) {
        for (const rate of room?.rates || []) {
            const policies = rate?.cancellation_policies;
            if (!Array.isArray(policies) || policies.length === 0) continue;
            const allDatesInFuture = policies.every(
                (policy) => policy?.from && moment.utc(policy.from).isAfter(now)
            );
            if (allDatesInFuture) return true;
        }
    }
    return false;
};

const containerStyle = { width: "100%", height: "100%" };

const FILTER_KEYS = {
    budget: "budget",
    stars: "stars",
    meal: "meal",
    name: "name",
    sort: "sort",
    distance: "distance",
};

function MapFilterBar({ onHideMap }) {
    const {
        search,
        sort,
        star,
        meal,
        distances,
        setDistances,
        priceRange,
        minPrice,
        maxPrice,
        setSearch,
        setStar,
        setMeal,
        setSort,
        resetPriceRange,
        showDistance,
        hotelNames,
    } = useHotelList();
    const [openKey, setOpenKey] = useState(null);
    const [nameDraft, setNameDraft] = useState(search || "");
    const barRef = useRef(null);

    const isBudgetApplied =
        Number(priceRange?.[0]) !== Number(minPrice) ||
        Number(priceRange?.[1]) !== Number(maxPrice);
    const isStarsApplied = star?.length > 0;
    const isMealApplied = meal?.length > 0;
    const isNameApplied = Boolean(search?.trim());
    const isSortApplied = Boolean(sort && sort !== "recommended");
    const isDistanceApplied = distances?.length > 0;

    const toggle = (key) => {
        setOpenKey((prev) => {
            const next = prev === key ? null : key;
            if (next === FILTER_KEYS.name) {
                setNameDraft(search || "");
            }
            return next;
        });
    };

    const clearFilter = (key) => {
        if (key === FILTER_KEYS.budget) resetPriceRange();
        if (key === FILTER_KEYS.stars) setStar([]);
        if (key === FILTER_KEYS.meal) setMeal([]);
        if (key === FILTER_KEYS.name) {
            setNameDraft("");
            setSearch(null);
        }
        if (key === FILTER_KEYS.sort) setSort("recommended");
        if (key === FILTER_KEYS.distance) setDistances([]);
        setOpenKey(null);
    };

    const applyFilter = (key) => {
        if (key === FILTER_KEYS.name) {
            const query = nameDraft.trim();
            setSearch(query || null);
        }
        setOpenKey(null);
    };

    useEffect(() => {
        if (!openKey) return;
        const onPointerDown = (e) => {
            const target = e.target;
            if (barRef.current?.contains(target)) return;
            // Autocomplete suggestions render in a portal outside the bar
            if (isInsideMantineOverlay(target)) return;
            setOpenKey(null);
        };
        const onKeyDown = (e) => {
            if (e.key === "Escape") setOpenKey(null);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [openKey]);

    const nameSuggestions = useMemo(() => {
        const q = nameDraft.trim().toLowerCase();
        const names = hotelNames || [];
        if (!q) return names.slice(0, 12);
        return names.filter((n) => n?.toLowerCase().includes(q)).slice(0, 12);
    }, [hotelNames, nameDraft]);

    const pills = [
        {
            key: FILTER_KEYS.budget,
            label: "Budget",
            applied: isBudgetApplied,
            content: <PriceRange />,
            wide: true,
        },
        {
            key: FILTER_KEYS.stars,
            label: "Stars",
            applied: isStarsApplied,
            content: <StarFilter />,
        },
        {
            key: FILTER_KEYS.meal,
            label: "Meal plan",
            applied: isMealApplied,
            content: <MealType />,
        },
        {
            key: FILTER_KEYS.name,
            label: "Name",
            applied: isNameApplied,
            wide: true,
            content: (
                <div className={styles.filterNameField}>
                    <p className={styles.filterNameLabel}>Search By Name</p>
                    <Autocomplete
                        value={nameDraft}
                        onChange={setNameDraft}
                        onOptionSubmit={(value) => {
                            setNameDraft(value);
                            setSearch(value?.trim() || null);
                        }}
                        placeholder="Hotel name"
                        data={nameSuggestions}
                        limit={12}
                        withScrollArea
                        maxDropdownHeight={240}
                        comboboxProps={{
                            withinPortal: false,
                            position: "bottom-start",
                            middlewares: { flip: false, shift: true },
                            transitionProps: { duration: 0 },
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                applyFilter(FILTER_KEYS.name);
                            }
                        }}
                    />
                </div>
            ),
        },
        {
            key: FILTER_KEYS.sort,
            label: "Sort",
            applied: isSortApplied,
            content: <SortOption />,
        },
        ...(showDistance
            ? [
                  {
                      key: FILTER_KEYS.distance,
                      label: "Distance",
                      applied: isDistanceApplied,
                      content: <DistanceFilter />,
                  },
              ]
            : []),
    ];

    return (
        <div
            className={`${styles.filterBar} ${openKey ? styles.filterBarOpen : ""}`}
            ref={barRef}
        >
            <div className={styles.filterBarInner}>
                <button type="button" className={styles.hideMapBtn} onClick={onHideMap}>
                    <MdMap size={15} />
                    Hide map
                </button>

                <div className={styles.filterDivider} aria-hidden="true" />

                {pills.map((pill) => {
                    const isOpen = openKey === pill.key;
                    return (
                        <div key={pill.key} className={styles.filterPillWrap}>
                            <button
                                type="button"
                                className={`${styles.filterPill} ${
                                    pill.applied ? styles.filterPillApplied : ""
                                } ${isOpen ? styles.filterPillOpen : ""}`}
                                onClick={() => toggle(pill.key)}
                                aria-expanded={isOpen}
                            >
                                {pill.label}
                                {isOpen ? (
                                    <LiaAngleUpSolid size={12} />
                                ) : (
                                    <LiaAngleDownSolid size={12} />
                                )}
                            </button>
                            {isOpen && (
                                <div
                                    className={`${styles.filterDropdown} ${
                                        pill.wide ? styles.filterDropdownWide : ""
                                    } ${
                                        pill.key === FILTER_KEYS.name
                                            ? styles.filterDropdownName
                                            : ""
                                    }`}
                                    role="dialog"
                                    aria-label={pill.label}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className={styles.filterDropdownBody}>
                                        {pill.content}
                                    </div>
                                    <div className={styles.filterDropdownActions}>
                                        <button
                                            type="button"
                                            className={styles.filterClearBtn}
                                            onClick={() => clearFilter(pill.key)}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.filterApplyBtn}
                                            onClick={() => applyFilter(pill.key)}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function HotelMapMobileTrigger({ onClick }) {
    return (
        <button
            type="button"
            className={`d-md-none ${styles.mobileMapLink}`}
            onClick={onClick}
        >
            <MdMap size={16} />
            Map View
        </button>
    );
}

function useHotelBasicDetail(item, check_in, check_out) {
    return useQuery({
        queryKey: ["hotelDetail", item.id, item.provider, check_in, check_out],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/hotel/basic/details`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        provider: item.provider,
                        hotelId: String(item.id),
                        checkIn: check_in,
                        checkOut: check_out,
                    }),
                }
            );
            const res = await response.json();
            return {
                images:
                    Array.isArray(res.data?.main_images) &&
                    res.data.main_images.length > 0
                        ? res.data.main_images[0].url || ""
                        : "",
                address: res.data?.address || "",
                facilities: res.data?.facilities || [],
            };
        },
        enabled: !!item?.id && !!item?.provider && !!check_in && !!check_out,
        cacheTime: 20 * 60 * 1000,
        staleTime: 20 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
}

function MapListCard({
    hotel,
    isSelected,
    isHovered,
    onSelect,
    onHover,
    check_in,
    check_out,
    nights,
    currency,
    rates,
}) {
    const [imgFallback, setImgFallback] = useState(false);
    const cardRef = useRef(null);
    const { data: detail } = useHotelBasicDetail(hotel, check_in, check_out);
    const { showDistance, distanceCache, distanceLandmarkLabel } = useHotelList();
    const dist = showDistance ? distanceCache?.[hotel?.id] : null;

    const { newcurrency, newprice } = ConvertPrice(
        hotel.metadata?.min_price,
        hotel.metadata?.currency,
        currency,
        rates
    );

    const totalPrice = Number(newprice);
    const perNightPrice =
        Number.isFinite(totalPrice) && nights > 0 ? totalPrice / nights : totalPrice;

    const starCount =
        hotel?.metadata?.stars && !isNaN(hotel.metadata.stars)
            ? Math.round(Number(hotel.metadata.stars))
            : 0;
    const freeCancel = hasFreeCancellation(hotel);

    useEffect(() => {
        if (isSelected && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [isSelected]);

    return (
        <article
            ref={cardRef}
            className={`${styles.listCard} ${isSelected ? styles.listCardSelected : ""} ${
                isHovered && !isSelected ? styles.listCardHovered : ""
            }`}
            onClick={() => onSelect(hotel)}
            onMouseEnter={() => onHover?.(hotel)}
            onMouseLeave={() => onHover?.(null)}
        >
            <div className={styles.listCardMedia}>
                <Image
                    src={
                        imgFallback
                            ? "/images/hotelloadimg.jpg"
                            : normalizeImageSrc(detail?.images || "/images/hotelloadimg.jpg")
                    }
                    width={200}
                    height={160}
                    className={styles.listCardImg}
                    alt={hotel.name}
                    quality={80}
                    onError={() => setImgFallback(true)}
                    unoptimized={true}
                />
                {hotel?.provider === "custom" && (
                    <span className={styles.listCardBadge}>AL</span>
                )}
                <div className={styles.listCardStars}>
                    {starCount > 0 ? (
                        Array(starCount)
                            .fill(0)
                            .map((_, i) => (
                                <FaStar key={i} className={styles.listCardStar} />
                            ))
                    ) : (
                        <span className={styles.listCardNoRating}>No Rating</span>
                    )}
                </div>
            </div>

            <div className={styles.listCardBody}>
                <div className={styles.listCardTitleRow}>
                    <h4 className={styles.listCardTitle}>{hotel.name}</h4>
                    {showDistance &&
                        (dist?.loading ? (
                            <span
                                className={`${styles.listCardDistance} ${styles.listCardDistanceLoading}`}
                                aria-hidden="true"
                            />
                        ) : dist && !dist.error && dist.distance ? (
                            <span className={styles.listCardDistance}>
                                {dist.distance} {distanceLandmarkLabel}
                            </span>
                        ) : null)}
                </div>

                <p className={styles.listCardLocation}>
                    <IoLocationSharp size={12} />
                    <span>{detail?.address || "Address loading…"}</span>
                </p>

                {freeCancel && (
                    <span className={styles.listCardCancel}>
                        <FaCheck size={10} /> Free Cancellation
                    </span>
                )}

                <div className={styles.listCardBottom}>
                    <div className={styles.listCardPricing}>
                        <span className={styles.listCardPrice}>
                            {newcurrency} {formatPrice(totalPrice)}
                        </span>
                        <span className={styles.listCardPerNight}>
                            {newcurrency} {formatPrice(perNightPrice)} / night
                        </span>
                        <span className={styles.listCardNights}>
                            {nights} {nights === 1 ? "night" : "nights"} · incl. taxes
                        </span>
                    </div>

                    <Link
                        target="_blank"
                        className={styles.listCardCta}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hotel?.rooms) {
                                localStorage.setItem(
                                    "roomSelection",
                                    JSON.stringify(hotel.rooms)
                                );
                            }
                        }}
                        href={`/hotels/${makingSlug(hotel.name)}?id=${hotel.id}&code=${getProviderCode(
                            hotel.provider
                        )}`}
                    >
                        View deal
                    </Link>
                </div>
            </div>
        </article>
    );
}

function MapFloatingCard({ hotel, onClose, check_in, check_out, nights, currency, rates }) {
    const [imgFallback, setImgFallback] = useState(false);
    const { data: detail } = useHotelBasicDetail(hotel, check_in, check_out);
    const { showDistance, distanceCache, distanceLandmarkLabel } = useHotelList();
    const dist = showDistance ? distanceCache?.[hotel?.id] : null;

    useEffect(() => {
        setImgFallback(false);
    }, [hotel.id, hotel.provider]);

    const { newcurrency, newprice } = ConvertPrice(
        hotel.metadata?.min_price,
        hotel.metadata?.currency,
        currency,
        rates
    );

    const totalPrice = Number(newprice);
    const perNightPrice =
        Number.isFinite(totalPrice) && nights > 0 ? totalPrice / nights : totalPrice;

    const starCount =
        hotel?.metadata?.stars && !isNaN(hotel.metadata.stars)
            ? Math.round(Number(hotel.metadata.stars))
            : 0;

    const freeCancel = hasFreeCancellation(hotel);

    const shortLocation = detail?.address
        ? detail.address.split(",").slice(0, 2).join(",").trim()
        : "";

    return (
        <div className={styles.floatingCard} role="dialog" aria-label={hotel.name}>
            <div className={styles.floatingCardMedia}>
                <Image
                    src={
                        imgFallback
                            ? "/images/hotelloadimg.jpg"
                            : normalizeImageSrc(detail?.images || "/images/hotelloadimg.jpg")
                    }
                    width={120}
                    height={110}
                    className={styles.floatingCardImg}
                    alt={hotel.name}
                    quality={80}
                    onError={() => setImgFallback(true)}
                    unoptimized={true}
                />
            </div>

            <div className={styles.floatingCardBody}>
                <div className={styles.floatingCardTop}>
                    <h4 className={styles.floatingCardTitle}>{hotel.name}</h4>
                    <button
                        type="button"
                        className={styles.floatingCardClose}
                        onClick={onClose}
                        aria-label="Close hotel preview"
                    >
                        <MdClose size={18} />
                    </button>
                </div>

                <div className={styles.floatingCardMeta}>
                    {starCount > 0 && (
                        <span className={styles.floatingCardStars}>
                            {Array(starCount)
                                .fill(0)
                                .map((_, i) => (
                                    <FaStar key={i} className={styles.floatingCardStar} />
                                ))}
                        </span>
                    )}
                    {shortLocation && (
                        <span className={styles.floatingCardLocation}>{shortLocation}</span>
                    )}
                </div>

                {showDistance &&
                    (dist?.loading ? (
                        <span
                            className={`${styles.floatingCardDistance} ${styles.floatingCardDistanceLoading}`}
                            aria-hidden="true"
                        />
                    ) : dist && !dist.error && dist.distance ? (
                        <span className={styles.floatingCardDistance}>
                            {dist.distance} {distanceLandmarkLabel}
                        </span>
                    ) : null)}

                <div className={styles.floatingCardBottom}>
                    <div className={styles.floatingCardLeft}>
                        {freeCancel && (
                            <span className={styles.floatingCardCancel}>
                                <FaCheck size={10} /> Free Cancellation
                            </span>
                        )}
                        <Link
                            target="_blank"
                            className={styles.floatingCardCta}
                            onClick={() => {
                                if (hotel?.rooms) {
                                    localStorage.setItem(
                                        "roomSelection",
                                        JSON.stringify(hotel.rooms)
                                    );
                                }
                            }}
                            href={`/hotels/${makingSlug(hotel.name)}?id=${hotel.id}&code=${getProviderCode(
                                hotel.provider
                            )}`}
                        >
                            View deal
                        </Link>
                    </div>
                    <div className={styles.floatingCardPricing}>
                        <span className={styles.floatingCardPrice}>
                            {newcurrency} {formatPrice(totalPrice)}
                        </span>
                        <span className={styles.floatingCardPerNight}>
                            {newcurrency} {formatPrice(perNightPrice)} / night
                        </span>
                        <span className={styles.floatingCardTaxes}>
                            {nights} {nights === 1 ? "night" : "nights"} · incl. taxes
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const HotelPriceMarker = memo(
    function HotelPriceMarker({
        position,
        labelText,
        isActive,
        zIndex,
        hotel,
        onSelect,
        onHover,
    }) {
        const icon = getPriceMarkerIcon(isActive);
        const labelColor = isActive ? BRAND_PRIMARY : BRAND_INK;

        return (
            <Marker
                position={position}
                onClick={() => onSelect(hotel)}
                onMouseOver={() => onHover(hotel)}
                onMouseOut={() => onHover(null)}
                icon={icon}
                zIndex={zIndex}
                label={{
                    text: labelText,
                    color: labelColor,
                    fontSize: "11px",
                    fontWeight: "bold",
                }}
            />
        );
    },
    (prev, next) =>
        prev.isActive === next.isActive &&
        prev.zIndex === next.zIndex &&
        prev.labelText === next.labelText &&
        prev.hotel === next.hotel &&
        prev.position.lat === next.position.lat &&
        prev.position.lng === next.position.lng
);

const HotelClusterMarker = memo(
    function HotelClusterMarker({ position, count, onZoomIn }) {
        const icon = useMemo(() => getClusterMarkerIcon(), []);
        const label = useMemo(
            () => ({
                text: String(count),
                color: BRAND_INK,
                fontSize: count > 99 ? "11px" : "13px",
                fontWeight: "bold",
            }),
            [count]
        );

        return (
            <Marker
                position={position}
                onClick={() => onZoomIn(position)}
                icon={icon}
                zIndex={500}
                label={label}
                title={`${count} properties — zoom in`}
            />
        );
    },
    (prev, next) =>
        prev.count === next.count &&
        prev.position.lat === next.position.lat &&
        prev.position.lng === next.position.lng
);

const HotelMap = forwardRef(function HotelMap(
    { hotels = [], lat, long, location, showPreview = true },
    ref
) {
    const [modalChange, setModalChange] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [hoveredHotel, setHoveredHotel] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [mapBounds, setMapBounds] = useState(null);
    const [mapZoom, setMapZoom] = useState(14);
    const mapInstanceRef = useRef(null);
    const listScrollRef = useRef(null);
    const hoverClearTimerRef = useRef(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;
    const { currency, rates } = useCurrency();
    const {
        filteredHotels,
        totalHotels,
        search,
        sort,
        star,
        meal,
        distance,
        distances,
        priceRange,
    } = useHotelList();
    const activeDistance = distance || distances || [];
    const searchParams = useSearchParams();
    const check_in = searchParams.get("checkIn");
    const check_out = searchParams.get("checkOut");
    const nights = Math.max(1, moment(check_out).diff(moment(check_in), "days") || 1);
    const placeLabel =
        location ||
        searchParams.get("place") ||
        searchParams.get("location") ||
        searchParams.get("city") ||
        "";
    const countryLabel = searchParams.get("country") || "";
    const countryCode = (searchParams.get("code") || "").trim().toLowerCase();

    const mapCenter = useMemo(
        () => ({ lat: Number(lat), lng: Number(long) }),
        [lat, long]
    );
    const centerHint = useMemo(() => {
        if (!Number.isFinite(mapCenter.lat) || !Number.isFinite(mapCenter.lng)) return null;
        if (mapCenter.lat === 0 && mapCenter.lng === 0) return null;
        return mapCenter;
    }, [mapCenter]);

    const [coordOverrides, setCoordOverrides] = useState({});
    const coordFetchStarted = useRef(new Set());
    const geocodeGeneration = useRef(0);
    const geocodeInflight = useRef(new Map());

    const resolveCoords = useCallback(
        (hotel, key) => {
            const k = key || hotelKey(hotel);
            if (k && coordOverrides[k]) return coordOverrides[k];
            const native = getHotelCoords(hotel, centerHint);
            if (native) {
                // Native point wildly far from search → treat as missing (likely swapped lat/lng)
                if (
                    centerHint &&
                    coordDistanceSq(native, centerHint) > 64
                ) {
                    return null;
                }
                return native;
            }
            if (k) {
                const cached = readGeoCache(k);
                if (cached) {
                    if (
                        centerHint &&
                        coordDistanceSq(cached, centerHint) > 64
                    ) {
                        return null;
                    }
                    return cached;
                }
            }
            return null;
        },
        [coordOverrides, centerHint]
    );

    // Prefer filtered list so map pills stay in sync with filters
    const sourceHotels = useMemo(() => {
        if (Array.isArray(filteredHotels) && filteredHotels.length) return filteredHotels;
        return Array.isArray(hotels) ? hotels : [];
    }, [filteredHotels, hotels]);

    const hotelIdsSignature = useMemo(
        () => sourceHotels.map((h) => hotelKey(h)).filter(Boolean).join("|"),
        [sourceHotels]
    );

    const applyCoords = useCallback((key, coords) => {
        if (!key || !coords) return;
        writeGeoCache(key, coords);
        setCoordOverrides((prev) =>
            prev[key] &&
            prev[key].lat === coords.lat &&
            prev[key].lng === coords.lng
                ? prev
                : { ...prev, [key]: coords }
        );
    }, []);

    const geocodeHotelNow = useCallback(
        async (hotel, { force = false } = {}) => {
            const key = hotelKey(hotel);
            if (!key) return null;

            const existing = resolveCoords(hotel, key);
            if (existing && !force) return existing;

            if (geocodeInflight.current.has(key)) {
                return geocodeInflight.current.get(key);
            }

            const job = (async () => {
                coordFetchStarted.current.add(key);
                const queries = buildHotelGeocodeQueries(
                    hotel,
                    placeLabel,
                    countryLabel
                );
                let coords = null;

                for (const query of queries) {
                    coords = await resolveViaPlacesApi(query);
                    if (coords) break;
                }

                if (
                    !coords &&
                    typeof window !== "undefined" &&
                    window.google?.maps?.Geocoder
                ) {
                    const geocoder = new window.google.maps.Geocoder();
                    const geoOptions = {};
                    if (/^[a-z]{2}$/.test(countryCode)) {
                        geoOptions.componentRestrictions = { country: countryCode };
                        geoOptions.region = countryCode;
                    }
                    for (const query of queries) {
                        const result = await geocodeAddress(
                            geocoder,
                            query,
                            geoOptions
                        );
                        if (result && result !== "OVER_QUERY_LIMIT") {
                            coords = result;
                            break;
                        }
                    }
                }

                if (coords) applyCoords(key, coords);
                else coordFetchStarted.current.delete(key);

                return coords;
            })();

            geocodeInflight.current.set(key, job);
            try {
                return await job;
            } finally {
                geocodeInflight.current.delete(key);
            }
        },
        [resolveCoords, placeLabel, countryLabel, countryCode, applyCoords]
    );

    // Seed coords from session cache / corrected native coords
    useEffect(() => {
        if (!hotelIdsSignature) return;
        setCoordOverrides((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const hotel of sourceHotels) {
                const key = hotelKey(hotel);
                if (!key || next[key]) continue;
                const coords = resolveCoords(hotel, key);
                if (coords) {
                    next[key] = coords;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [hotelIdsSignature, sourceHotels, resolveCoords]);

    // Resolve missing lat/lng via Places API (primary) → Geocoder (optional)
    useEffect(() => {
        if (!modalChange || !hotelIdsSignature) return;

        const generation = ++geocodeGeneration.current;
        let cancelled = false;

        const missing = sourceHotels.filter((hotel) => {
            const key = hotelKey(hotel);
            if (!key || coordFetchStarted.current.has(key)) return false;
            if (resolveCoords(hotel, key)) return false;
            return true;
        });

        if (!missing.length) return undefined;

        // Prefer hotels currently visible in the list panel first
        const priority = missing.slice(0, Math.max(visibleCount, PAGE_SIZE));
        const rest = missing.slice(priority.length);
        const queue = [...priority, ...rest];

        const workers = Array.from(
            { length: Math.min(6, queue.length) },
            async () => {
                while (queue.length && !cancelled && generation === geocodeGeneration.current) {
                    const hotel = queue.shift();
                    if (!hotel) break;
                    await geocodeHotelNow(hotel);
                    await sleep(80);
                }
            }
        );

        Promise.all(workers);

        return () => {
            cancelled = true;
            geocodeGeneration.current += 1;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        modalChange,
        hotelIdsSignature,
        placeLabel,
        countryLabel,
        countryCode,
        scriptLoaded,
        visibleCount,
    ]);

    // Keep overrides for hotels still in the list when the search result set changes
    useEffect(() => {
        const validKeys = new Set(
            sourceHotels.map((h) => hotelKey(h)).filter(Boolean)
        );
        setCoordOverrides((prev) => {
            const next = {};
            let changed = false;
            for (const [key, value] of Object.entries(prev)) {
                if (validKeys.has(key)) next[key] = value;
                else changed = true;
            }
            return changed ? next : prev;
        });
        for (const key of [...coordFetchStarted.current]) {
            if (!validKeys.has(key)) coordFetchStarted.current.delete(key);
        }
    }, [hotelIdsSignature, sourceHotels]);

    const mapHotels = useMemo(() => {
        const items = [];
        for (let index = 0; index < sourceHotels.length; index++) {
            const hotel = sourceHotels[index];
            const key = hotelKey(hotel);
            const coords = resolveCoords(hotel, key);
            if (!coords) continue;

            const converted = ConvertPrice(
                hotel.metadata?.min_price,
                hotel.metadata?.currency,
                currency,
                rates
            );
            const labelCurrency = hotel.currency || converted.newcurrency;
            const labelPrice = Number.isFinite(Number(hotel.price))
                ? hotel.price
                : converted.newprice;

            items.push({
                key,
                hotel,
                index,
                position: { lat: coords.lat, lng: coords.lng },
                labelText: `${labelCurrency} ${formatPrice(labelPrice)}`,
            });
        }
        return items;
    }, [sourceHotels, currency, rates, resolveCoords]);

    const selectedKey = hotelKey(selectedHotel);
    const hoveredKey = hotelKey(hoveredHotel);

    const baseDisplayMarkers = useMemo(
        () => buildViewportMarkers(mapHotels, mapBounds, mapZoom, selectedKey),
        [mapHotels, mapBounds, mapZoom, selectedKey]
    );

    const displayMarkers = useMemo(() => {
        let markers = baseDisplayMarkers;
        const ensureVisible = (key) => {
            if (!key) return markers;
            const alreadyVisible = markers.some(
                (m) => m.type === "hotel" && m.key === key
            );
            if (alreadyVisible) return markers;
            const found = mapHotels.find((m) => m.key === key);
            if (!found) return markers;
            return [...markers, { type: "hotel", ...found }];
        };
        markers = ensureVisible(selectedKey);
        markers = ensureVisible(hoveredKey);
        return markers;
    }, [baseDisplayMarkers, hoveredKey, selectedKey, mapHotels]);

    const handleSelectHotel = useCallback(
        (hotel) => {
            setSelectedHotel(hotel);
            const key = hotelKey(hotel);
            if (!resolveCoords(hotel, key)) {
                // Force Places lookup so the pill appears even if native coords were bad/missing
                geocodeHotelNow(hotel, { force: true });
            }
        },
        [resolveCoords, geocodeHotelNow]
    );

    const handleHoverHotel = useCallback(
        (hotel) => {
            if (hoverClearTimerRef.current) {
                clearTimeout(hoverClearTimerRef.current);
                hoverClearTimerRef.current = null;
            }

            if (!hotel) {
                hoverClearTimerRef.current = setTimeout(() => {
                    setHoveredHotel(null);
                    hoverClearTimerRef.current = null;
                }, 40);
                return;
            }

            setHoveredHotel((prev) => {
                if (prev && prev.id === hotel.id && prev.provider === hotel.provider)
                    return prev;
                return hotel;
            });

            const key = hotelKey(hotel);
            if (!resolveCoords(hotel, key)) {
                geocodeHotelNow(hotel);
            }
        },
        [resolveCoords, geocodeHotelNow]
    );

    useEffect(() => {
        return () => {
            if (hoverClearTimerRef.current) clearTimeout(hoverClearTimerRef.current);
        };
    }, []);

    const handleClusterZoom = useCallback((position) => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const nextZoom = Math.min((map.getZoom() || 14) + 2, 18);
        map.panTo(position);
        map.setZoom(nextZoom);
    }, []);

    const syncMapViewport = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const nextZoom = map.getZoom();
        if (typeof nextZoom === "number") {
            setMapZoom((prev) => (prev === nextZoom ? prev : nextZoom));
        }

        const nextBounds = map.getBounds();
        if (!nextBounds) return;

        setMapBounds((prev) => {
            if (prev) {
                const pne = prev.getNorthEast();
                const psw = prev.getSouthWest();
                const nne = nextBounds.getNorthEast();
                const nsw = nextBounds.getSouthWest();
                if (
                    pne.lat() === nne.lat() &&
                    pne.lng() === nne.lng() &&
                    psw.lat() === nsw.lat() &&
                    psw.lng() === nsw.lng()
                ) {
                    return prev;
                }
            }
            return nextBounds;
        });
    }, []);

    const filterSignature = useMemo(
        () =>
            [
                sourceHotels.length,
                search || "",
                sort || "",
                (star || []).join(","),
                (meal || []).join(","),
                (activeDistance || []).join(","),
                priceRange?.[0],
                priceRange?.[1],
            ].join("|"),
        [sourceHotels.length, search, sort, star, meal, activeDistance, priceRange]
    );

    useEffect(() => {
        if (!selectedHotel || !mapInstanceRef.current) return;
        const key = hotelKey(selectedHotel);
        const coords = resolveCoords(selectedHotel, key);
        if (!coords) return;
        mapInstanceRef.current.panTo({
            lat: coords.lat,
            lng: coords.lng,
        });
        mapInstanceRef.current.panBy(0, 80);
    }, [selectedHotel, resolveCoords]);

    const visibleHotels = useMemo(
        () => sourceHotels.slice(0, visibleCount),
        [sourceHotels, visibleCount]
    );
    const hasMoreHotels = visibleCount < sourceHotels.length;

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
        setSelectedHotel(null);
        if (listScrollRef.current) {
            listScrollRef.current.scrollTop = 0;
        }
    }, [modalChange, filterSignature]);

    const handleListScroll = () => {
        const el = listScrollRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
        if (nearBottom) {
            setVisibleCount((prev) => {
                if (prev >= sourceHotels.length) return prev;
                return Math.min(prev + PAGE_SIZE, sourceHotels.length);
            });
        }
    };

    useEffect(() => {
        if (!modalChange || visibleCount >= sourceHotels.length) return;
        const el = listScrollRef.current;
        if (!el) return;
        if (el.scrollHeight <= el.clientHeight + 20) {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sourceHotels.length));
        }
    }, [modalChange, visibleCount, sourceHotels.length]);

    useImperativeHandle(ref, () => ({
        openMap: () => setModalChange(true),
    }));

    useEffect(() => {
        let timer;
        if (modalChange) {
            if (window.google?.maps) {
                setScriptLoaded(true);
            }
            timer = setTimeout(() => setShowMap(true), 300);
        } else {
            setShowMap(false);
            setMapReady(false);
            setMapBounds(null);
            setMapZoom(14);
            setSelectedHotel(null);
            setHoveredHotel(null);
        }
        return () => clearTimeout(timer);
    }, [modalChange]);

    const isSameHotel = (a, b) =>
        !!a && !!b && a.id === b.id && a.provider === b.provider;

    const canRenderMarkers = scriptLoaded && mapReady;
    const propertyCount = totalHotels || sourceHotels.length;

    return (
        <>
            {showPreview && (
                <div className="mb-4 d-none d-md-block">
                    <div
                        className="position-relative"
                        style={{
                            width: "100%",
                            height: "210px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "1px solid rgba(2, 36, 94, 0.12)",
                            boxShadow: "0 12px 36px rgba(2, 36, 94, 0.12)",
                        }}
                    >
                        <iframe
                            width="100%"
                            height="210"
                            frameBorder="0"
                            scrolling="no"
                            marginHeight="0"
                            marginWidth="0"
                            src={`https://maps.google.com/maps?q=${lat},${long}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                            style={{ border: "0", borderRadius: "10px" }}
                            title="Hotel location map preview"
                        />

                        <div
                            className={`position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center ${styles.previewOverlay}`}
                        >
                            <button
                                type="button"
                                className={styles.showMapBtn}
                                onClick={() => setModalChange(true)}
                            >
                                Show on Map
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                opened={modalChange}
                onClose={() => setModalChange(false)}
                withCloseButton={false}
                fullScreen
                radius={0}
                padding={0}
                transitionProps={{ transition: "fade", duration: 200 }}
                classNames={{ body: styles.modalBody, content: styles.modalContent }}
            >
                <div className={styles.mapView}>
                    <MapFilterBar onHideMap={() => setModalChange(false)} />

                    <div className={styles.splitLayout}>
                        <aside className={styles.listPanel}>
                            <div className={styles.listHeader}>
                                <div className={styles.listHeaderTop}>
                                    <div className={styles.listHeaderCopy}>
                                        <span className={styles.listEyebrow}>Explore map</span>
                                        <p className={styles.listCount}>
                                            {propertyCount}{" "}
                                            {propertyCount === 1 ? "property" : "properties"}
                                            {placeLabel ? ` in ${placeLabel}` : ""}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.closeBtn}
                                        onClick={() => setModalChange(false)}
                                        aria-label="Close map view"
                                    >
                                        <MdClose size={22} />
                                    </button>
                                </div>
                            </div>

                            <div
                                className={styles.listScroll}
                                ref={listScrollRef}
                                onScroll={handleListScroll}
                            >
                                {visibleHotels.length === 0 ? (
                                    <div className={styles.listEmpty}>
                                        No properties match your filters.
                                    </div>
                                ) : (
                                    visibleHotels.map((hotel, index) => (
                                        <MapListCard
                                            key={`${hotel.id}-${hotel.provider}-${index}`}
                                            hotel={hotel}
                                            isSelected={isSameHotel(selectedHotel, hotel)}
                                            isHovered={isSameHotel(hoveredHotel, hotel)}
                                            onSelect={handleSelectHotel}
                                            onHover={handleHoverHotel}
                                            check_in={check_in}
                                            check_out={check_out}
                                            nights={nights}
                                            currency={currency}
                                            rates={rates}
                                        />
                                    ))
                                )}
                                {hasMoreHotels && (
                                    <div className={styles.listLoadMore}>
                                        Scroll for more…
                                    </div>
                                )}
                            </div>
                        </aside>

                        <div className={styles.mapPanel}>
                            <button
                                type="button"
                                className={`${styles.closeBtn} ${styles.closeBtnMap}`}
                                onClick={() => setModalChange(false)}
                                aria-label="Close map view"
                            >
                                <MdClose size={22} />
                            </button>

                            {!mapReady && (
                                <div
                                    className={styles.mapLoading}
                                    role="status"
                                    aria-live="polite"
                                >
                                    <MdMap
                                        className={styles.mapLoadingIcon}
                                        size={36}
                                        aria-hidden="true"
                                    />
                                    <p className={styles.mapLoadingText}>
                                        Loading map{placeLabel ? ` of ${placeLabel}` : ""}
                                    </p>
                                    <span
                                        className={styles.mapLoadingSpinner}
                                        aria-hidden="true"
                                    />
                                </div>
                            )}

                            {showMap && lat && long && (
                                <div className={styles.mapContainer}>
                                    <LoadScriptNext
                                        googleMapsApiKey={
                                            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                                        }
                                        onLoad={() => setScriptLoaded(true)}
                                    >
                                        <GoogleMap
                                            mapContainerStyle={containerStyle}
                                            center={mapCenter}
                                            zoom={14}
                                            options={{
                                                gestureHandling: "greedy",
                                                mapTypeControl: false,
                                                streetViewControl: false,
                                                fullscreenControl: false,
                                                clickableIcons: true,
                                            }}
                                            onLoad={(map) => {
                                                mapInstanceRef.current = map;
                                                setMapReady(true);
                                                const bounds = map.getBounds();
                                                const zoom = map.getZoom();
                                                if (bounds) setMapBounds(bounds);
                                                if (typeof zoom === "number")
                                                    setMapZoom(zoom);
                                            }}
                                            onIdle={syncMapViewport}
                                            onClick={() => setSelectedHotel(null)}
                                        >
                                            {canRenderMarkers &&
                                                displayMarkers.map((item) => {
                                                    if (item.type === "cluster") {
                                                        return (
                                                            <HotelClusterMarker
                                                                key={item.id}
                                                                position={item.position}
                                                                count={item.count}
                                                                onZoomIn={handleClusterZoom}
                                                            />
                                                        );
                                                    }

                                                    const isSelected =
                                                        item.key === selectedKey;
                                                    const isHovered =
                                                        item.key === hoveredKey;
                                                    const isActive =
                                                        isSelected || isHovered;

                                                    return (
                                                        <HotelPriceMarker
                                                            key={item.key}
                                                            hotel={item.hotel}
                                                            position={item.position}
                                                            labelText={item.labelText}
                                                            isActive={isActive}
                                                            zIndex={
                                                                isSelected
                                                                    ? 1000
                                                                    : isHovered
                                                                      ? 999
                                                                      : item.index
                                                            }
                                                            onSelect={handleSelectHotel}
                                                            onHover={handleHoverHotel}
                                                        />
                                                    );
                                                })}
                                        </GoogleMap>
                                    </LoadScriptNext>

                                    {selectedHotel && (
                                        <MapFloatingCard
                                            key={`${selectedHotel.id}-${selectedHotel.provider}`}
                                            hotel={selectedHotel}
                                            onClose={() => setSelectedHotel(null)}
                                            check_in={check_in}
                                            check_out={check_out}
                                            nights={nights}
                                            currency={currency}
                                            rates={rates}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
});

export default HotelMap;
