'use client'
import React, { useState, useEffect, useMemo } from 'react';
import Autocomplete from "react-google-autocomplete";
import { MdMyLocation, MdMap } from 'react-icons/md';
import { notifications } from '@mantine/notifications';

const DEFAULT_BOUND_RADIUS_KM = 100;

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/** Approximate bounding box around a center (no google.maps required). */
function boundsFromCenter(lat, lng, radiusKm) {
    const latDelta = radiusKm / 111;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const lngDelta = radiusKm / (111 * Math.max(cosLat, 0.01));
    return {
        north: lat + latDelta,
        south: lat - latDelta,
        east: lng + lngDelta,
        west: lng - lngDelta,
    };
}

function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Best-effort ISO country code from a country / region label. */
function countryToIso(country) {
    if (!country) return undefined;
    const raw = String(country).trim();
    if (/^[a-z]{2}$/i.test(raw)) return raw.toLowerCase();

    const text = raw.toLowerCase();
    const map = {
        'saudi arabia': 'sa',
        'kingdom of saudi arabia': 'sa',
        uae: 'ae',
        'united arab emirates': 'ae',
        'united kingdom': 'gb',
        uk: 'gb',
        pakistan: 'pk',
        turkey: 'tr',
        egypt: 'eg',
        jordan: 'jo',
        indonesia: 'id',
        malaysia: 'my',
        india: 'in',
        'united states': 'us',
        usa: 'us',
    };
    for (const [name, iso] of Object.entries(map)) {
        if (text.includes(name)) return iso;
    }
    // secondary text like "Makkah Province, Saudi Arabia"
    const parts = text.split(',').map((p) => p.trim());
    const last = parts[parts.length - 1];
    return map[last] || undefined;
}

export default function LocationPicker({
    label,
    value,
    onChange,
    error,
    placeholder,
    onOpenMap,
    required = true,
    name,
    boundLat = null,
    boundLng = null,
    boundLabel = '',
    boundCountry = '',
    boundRadiusKm = DEFAULT_BOUND_RADIUS_KM,
}) {
    const [isLoadingGPS, setIsLoadingGPS] = useState(false);
    const [locationDetails, setLocationDetails] = useState({
        address: value || '',
        lat: null,
        lng: null
    });

    const centerLat = toNumber(boundLat);
    const centerLng = toNumber(boundLng);
    const hasBounds = centerLat != null && centerLng != null;
    const cityLabel = boundLabel || 'the selected city';
    const countryIso = countryToIso(boundCountry);

    const autocompleteOptions = useMemo(() => {
        const options = {
            types: ['geocode', 'establishment'],
        };
        if (countryIso) {
            options.componentRestrictions = { country: countryIso };
        }
        if (hasBounds) {
            options.bounds = boundsFromCenter(centerLat, centerLng, boundRadiusKm);
            options.strictBounds = true;
            options.location = { lat: centerLat, lng: centerLng };
            options.radius = Math.round(boundRadiusKm * 1000);
        }
        return options;
    }, [hasBounds, centerLat, centerLng, boundRadiusKm, countryIso]);

    useEffect(() => {
        if (value !== locationDetails.address) {
            setLocationDetails(prev => ({
                ...prev,
                address: value || ''
            }));
        }
    }, [value]);

    const isWithinBound = (lat, lng) => {
        if (!hasBounds) return true;
        if (lat == null || lng == null) return false;
        return distanceKm(centerLat, centerLng, Number(lat), Number(lng)) <= boundRadiusKm;
    };

    const rejectOutOfBound = () => {
        notifications.show({
            title: 'Outside search area',
            message: `Please select a location within or near ${cityLabel}.`,
            color: 'red',
            autoClose: 4500,
        });
    };

    const handlePlaceSelected = (place) => {
        if (!place || !place.formatted_address) return;

        const address = place.formatted_address;
        const lat = place.geometry?.location?.lat?.() ?? place.geometry?.location?.lat;
        const lng = place.geometry?.location?.lng?.() ?? place.geometry?.location?.lng;

        if (hasBounds && !isWithinBound(lat, lng)) {
            rejectOutOfBound();
            return;
        }

        const details = {
            address,
            lat,
            lng,
            placeId: place.place_id
        };

        setLocationDetails(details);
        onChange(details);
    };

    const handleInputChange = (e) => {
        const newAddress = e.target.value;
        setLocationDetails(prev => ({
            ...prev,
            address: newAddress,
            // Clear stale coords when user types freely — must pick a bound suggestion
            lat: null,
            lng: null,
        }));

        onChange({
            address: newAddress,
            lat: null,
            lng: null,
        });
    };

    const handleGetCurrentLocation = async () => {
        if (!navigator.geolocation) {
            notifications.show({
                title: 'Not Supported',
                message: 'Geolocation is not supported by your browser',
                color: 'red',
                autoClose: 4000
            });
            return;
        }

        if (navigator.permissions) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

                if (permissionStatus.state === 'denied') {
                    notifications.show({
                        title: 'Permission Denied',
                        message: 'Location access was previously denied. Please enable it in your browser settings (click the lock icon in the address bar).',
                        color: 'red',
                        autoClose: 6000
                    });
                    return;
                }

                if (permissionStatus.state === 'prompt') {
                    notifications.show({
                        title: 'Permission Required',
                        message: 'Please allow location access when prompted by your browser',
                        color: 'blue',
                        autoClose: 3000
                    });
                }
            } catch (error) {
                console.log('Permission API not available');
            }
        }

        setIsLoadingGPS(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                if (hasBounds && !isWithinBound(lat, lng)) {
                    setIsLoadingGPS(false);
                    rejectOutOfBound();
                    return;
                }

                try {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode(
                        { location: { lat, lng } },
                        (results, status) => {
                            setIsLoadingGPS(false);

                            if (status === 'OK' && results[0]) {
                                const address = results[0].formatted_address;
                                const details = {
                                    address,
                                    lat,
                                    lng,
                                    placeId: results[0].place_id
                                };

                                setLocationDetails(details);
                                onChange(details);

                                notifications.show({
                                    title: 'Success ✓',
                                    message: 'Current location detected successfully',
                                    color: 'green',
                                    autoClose: 2000
                                });
                            } else {
                                notifications.show({
                                    title: 'Warning',
                                    message: 'Could not get address for your location',
                                    color: 'orange',
                                    autoClose: 3000
                                });
                            }
                        }
                    );
                } catch (error) {
                    setIsLoadingGPS(false);
                    notifications.show({
                        title: 'Error',
                        message: 'Failed to get address from coordinates',
                        color: 'red',
                        autoClose: 3000
                    });
                }
            },
            (error) => {
                setIsLoadingGPS(false);
                let title = 'Location Error';
                let message = 'Failed to get your location';
                let autoClose = 4000;

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        title = 'Permission Denied';
                        message = 'You denied location access. To enable it: Click the lock icon (🔒) in your browser\'s address bar → Site settings → Location → Allow';
                        autoClose = 8000;
                        break;
                    case error.POSITION_UNAVAILABLE:
                        title = 'Location Unavailable';
                        message = 'Your location could not be determined. Please check your device settings and try again.';
                        autoClose = 5000;
                        break;
                    case error.TIMEOUT:
                        title = 'Request Timeout';
                        message = 'Location request timed out. Please try again.';
                        autoClose = 4000;
                        break;
                }

                notifications.show({
                    title,
                    message,
                    color: 'red',
                    autoClose
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <div className="location-picker">
            <label className="form-label">
                {label}{required && '*'}
            </label>
            {/* {hasBounds && (
                <p className="small text-muted mb-1">
                    Locations limited to {cityLabel} area
                </p>
            )} */}

            <div className="d-flex gap-2 align-items-start">
                <div className="flex-grow-1">
                    <Autocomplete
                        key={`bound-${name}-${centerLat}-${centerLng}-${countryIso || 'xx'}`}
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                        placeholder={placeholder || "Enter location"}
                        className={`form-control ${error ? "is-invalid" : ""}`}
                        name={name}
                        value={locationDetails.address}
                        onChange={handleInputChange}
                        onPlaceSelected={handlePlaceSelected}
                        options={autocompleteOptions}
                    />
                    {error && <div className="invalid-feedback d-block">{error}</div>}
                </div>

                <div className="d-flex gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-primary position-relative"
                        onClick={handleGetCurrentLocation}
                        disabled={isLoadingGPS}
                        title="Click to use your current GPS location (browser will ask for permission)"
                        style={{ minWidth: '45px' }}
                    >
                        {isLoadingGPS ? (
                            <span className="spinner-border spinner-border-sm" />
                        ) : (
                            <MdMyLocation size={20} />
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => onOpenMap(name, locationDetails)}
                        title="Click to select location from interactive map"
                        style={{ minWidth: '45px' }}
                    >
                        <MdMap size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
