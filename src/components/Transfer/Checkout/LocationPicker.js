'use client'
import React, { useState, useEffect } from 'react';
import Autocomplete from "react-google-autocomplete";
import { MdMyLocation, MdMap } from 'react-icons/md';
import { notifications } from '@mantine/notifications';

export default function LocationPicker({ 
    label, 
    value, 
    onChange, 
    error, 
    placeholder,
    onOpenMap,
    required = true,
    name
}) {
    const [isLoadingGPS, setIsLoadingGPS] = useState(false);
    const [locationDetails, setLocationDetails] = useState({
        address: value || '',
        lat: null,
        lng: null
    });

    useEffect(() => {
        if (value !== locationDetails.address) {
            setLocationDetails(prev => ({
                ...prev,
                address: value || ''
            }));
        }
    }, [value]);

    const handlePlaceSelected = (place) => {
        if (!place || !place.formatted_address) return;

        const address = place.formatted_address;
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();

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
            address: newAddress
        }));
        
        // If user manually types, pass partial data
        onChange({
            address: newAddress,
            lat: locationDetails.lat,
            lng: locationDetails.lng
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

        // Check permission status if available
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
                // Permission API not supported, continue anyway
                console.log('Permission API not available');
            }
        }

        setIsLoadingGPS(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    // Reverse geocode to get address
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
            
            <div className="d-flex gap-2 align-items-start">
                <div className="flex-grow-1">
                    <Autocomplete
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                        placeholder={placeholder || "Enter location"}
                        className={`form-control ${error ? "is-invalid" : ""}`}
                        name={name}
                        value={locationDetails.address}
                        onChange={handleInputChange}
                        onPlaceSelected={handlePlaceSelected}
                        options={{
                            types: ["geocode", "establishment"],
                        }}
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
