'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '@mantine/core';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { notifications } from '@mantine/notifications';

const mapContainerStyle = {
    width: '100%',
    height: '500px'
};

const defaultCenter = {
    lat: 51.5074, // London
    lng: -0.1278
};

const DEFAULT_BOUND_RADIUS_KM = 100;

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
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

export default function LocationMapModal({
    isOpen,
    onClose,
    onSelectLocation,
    initialLocation,
    locationdata,
    title = "Select Location",
    boundLat = null,
    boundLng = null,
    boundLabel = '',
    boundRadiusKm = DEFAULT_BOUND_RADIUS_KM,
}) {
    // Helper to check if coordinate is valid
    const isValidCoord = (val) => val && val !== 'null' && val !== null && !isNaN(parseFloat(val));

    const centerLat = toNumber(boundLat);
    const centerLng = toNumber(boundLng);
    const hasBounds = centerLat != null && centerLng != null;
    const cityLabel = boundLabel || 'the selected city';

    const [fromLocation] = useState(() => {
        const lat = isValidCoord(locationdata?.fromLat) ? parseFloat(locationdata.fromLat) : null;
        const lng = isValidCoord(locationdata?.fromLng) ? parseFloat(locationdata.fromLng) : null;
        return { lat, lng };
    });

    const [toLocation] = useState(() => {
        let lat = isValidCoord(locationdata?.toLat)
            ? parseFloat(locationdata.toLat)
            : (isValidCoord(locationdata?.fromLat) ? parseFloat(locationdata.fromLat) : null);
        let lng = isValidCoord(locationdata?.toLng)
            ? parseFloat(locationdata.toLng)
            : (isValidCoord(locationdata?.fromLng) ? parseFloat(locationdata.fromLng) : null);
        return { lat, lng };
    });

    const [selectedPosition, setSelectedPosition] = useState(null);
    const [address, setAddress] = useState('');
    const [center, setCenter] = useState(() => {
        if (hasBounds) {
            return { lat: centerLat, lng: centerLng };
        }
        if (isValidCoord(locationdata?.fromLat) && isValidCoord(locationdata?.fromLng)) {
            return {
                lat: parseFloat(locationdata.fromLat),
                lng: parseFloat(locationdata.fromLng)
            };
        }
        return defaultCenter;
    });
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const mapRef = useRef(null);

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

    useEffect(() => {
        if (isOpen) {
            // If initial location provided, use it
            if (initialLocation?.lat && initialLocation?.lng) {
                setSelectedPosition({
                    lat: initialLocation.lat,
                    lng: initialLocation.lng
                });
                setCenter({
                    lat: initialLocation.lat,
                    lng: initialLocation.lng
                });
                setAddress(initialLocation.address || '');
            } else {
                // Prefer explicit bound center for this picker type
                if (hasBounds) {
                    setCenter({ lat: centerLat, lng: centerLng });
                    return;
                }

                // Determine which location to use based on the modal title
                const isPickup = title?.toLowerCase().includes('pickup');
                let targetLocation = null;

                if (isPickup && fromLocation.lat && fromLocation.lng) {
                    targetLocation = {
                        lat: fromLocation.lat,
                        lng: fromLocation.lng
                    };
                } else if (!isPickup && toLocation.lat && toLocation.lng) {
                    targetLocation = {
                        lat: toLocation.lat,
                        lng: toLocation.lng
                    };
                } else if (fromLocation.lat && fromLocation.lng) {
                    targetLocation = {
                        lat: fromLocation.lat,
                        lng: fromLocation.lng
                    };
                }

                if (targetLocation) {
                    setCenter(targetLocation);
                } else if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            setCenter({
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            });
                        },
                        (error) => {
                            console.log('Could not get current location:', error);
                        }
                    );
                }
            }
        }
    }, [isOpen, initialLocation, fromLocation, toLocation, title, hasBounds, centerLat, centerLng]);

    const handleMapClick = async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        if (!isWithinBound(lat, lng)) {
            rejectOutOfBound();
            return;
        }

        setSelectedPosition({ lat, lng });
        setIsLoadingAddress(true);

        try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
                { location: { lat, lng } },
                (results, status) => {
                    setIsLoadingAddress(false);

                    if (status === 'OK' && results[0]) {
                        setAddress(results[0].formatted_address);
                    } else {
                        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                        notifications.show({
                            title: 'Warning',
                            message: 'Could not get address for this location',
                            color: 'orange',
                            autoClose: 2000
                        });
                    }
                }
            );
        } catch (error) {
            setIsLoadingAddress(false);
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    };

    const handleConfirm = () => {
        if (!selectedPosition) {
            notifications.show({
                title: 'Error',
                message: 'Please click on the map to select a location',
                color: 'red',
                autoClose: 3000
            });
            return;
        }

        if (!isWithinBound(selectedPosition.lat, selectedPosition.lng)) {
            rejectOutOfBound();
            return;
        }

        onSelectLocation({
            address: address || `${selectedPosition.lat.toFixed(6)}, ${selectedPosition.lng.toFixed(6)}`,
            lat: selectedPosition.lat,
            lng: selectedPosition.lng
        });

        onClose();
    };

    const handleSearchLocation = () => {
        if (!address) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();

                if (!isWithinBound(lat, lng)) {
                    rejectOutOfBound();
                    return;
                }

                setSelectedPosition({ lat, lng });
                setCenter({ lat, lng });
                setAddress(results[0].formatted_address);

                if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng });
                }
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Location not found',
                    color: 'red',
                    autoClose: 3000
                });
            }
        });
    };

    const mapRestriction = useMemo(() => {
        if (!hasBounds) return undefined;
        const latDelta = boundRadiusKm / 111;
        const cosLat = Math.cos((centerLat * Math.PI) / 180);
        const lngDelta = boundRadiusKm / (111 * Math.max(cosLat, 0.01));
        return {
            latLngBounds: {
                north: centerLat + latDelta,
                south: centerLat - latDelta,
                east: centerLng + lngDelta,
                west: centerLng - lngDelta,
            },
            strictBounds: false,
        };
    }, [hasBounds, centerLat, centerLng, boundRadiusKm]);

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title={title}
            size="xl"
            centered
        >
            <div>
                <div className="mb-3">
                    <label className="form-label small text-muted">
                        {hasBounds
                            ? `Select a location within or near ${cityLabel}`
                            : 'Click on the map to select a location or search for an address'}
                    </label>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search for a location..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSearchLocation();
                                }
                            }}
                        />
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={handleSearchLocation}
                        >
                            Search
                        </button>
                    </div>
                </div>

                <div className="border rounded overflow-hidden" style={{ position: 'relative' }}>
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={center}
                        zoom={13}
                        onClick={handleMapClick}
                        onLoad={(map) => { mapRef.current = map; }}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: true,
                            fullscreenControl: true,
                            ...(mapRestriction ? { restriction: mapRestriction } : {}),
                        }}
                    >
                        {selectedPosition && (
                            <Marker
                                position={selectedPosition}
                                animation={window.google?.maps?.Animation?.DROP}
                            />
                        )}
                    </GoogleMap>

                    {isLoadingAddress && (
                        <div
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                            style={{ background: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}
                        >
                            <div className="spinner-border text-primary" />
                        </div>
                    )}
                </div>

                {selectedPosition && (
                    <div className="mt-3 p-3 bg-light rounded">
                        <div className="small text-muted mb-1">Selected Location:</div>
                        <div className="fw-bold">{address || 'Getting address...'}</div>
                        <div className="small text-muted mt-1">
                            Coordinates: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                        </div>
                    </div>
                )}

                <div className="d-flex gap-2 justify-content-end mt-3">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={!selectedPosition}
                    >
                        Confirm Location
                    </button>
                </div>
            </div>
        </Modal>
    );
}
