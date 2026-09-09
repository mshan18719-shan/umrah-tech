'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UmrahPackageContext = createContext(undefined);

const SESSION_STORAGE_KEY = 'umrah_package_selections';

export const UmrahPackageProvider = ({ children, packageId }) => {
    const [packageData, setPackageData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selections, setSelections] = useState({
        packageId: null,
        makkahHotel: { roomIndex: null, rateIndex: null },
        madinahHotel: { roomIndex: null, rateIndex: null },
        flight: null,
        customFlight: null, // Store full custom flight object when user selects from CustomizeFlight
        otherServices: { transfer_selected_id: null, visa_selected_id: null }
    });

    // Load selections from session storage
    const loadSelectionsFromStorage = useCallback((currentPackageId) => {
        try {
            const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Only restore if it's the same package
                if (parsed.packageId === currentPackageId) {
                    return parsed;
                } else {
                    // Different package, clear old data
                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                    return null;
                }
            }
        } catch (error) {
            console.error('Error loading selections from storage:', error);
        }
        return null;
    }, []);

    // Save selections to session storage
    const saveSelectionsToStorage = useCallback((selectionsData) => {
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(selectionsData));
        } catch (error) {
            console.error('Error saving selections to storage:', error);
        }
    }, []);

    // Initialize selections from API data (find selected_for_package items)
    const initializeDefaultSelections = useCallback((data) => {
        const defaultSelections = {
            packageId: packageId,
            makkahHotel: { roomIndex: null, rateIndex: null },
            madinahHotel: { roomIndex: null, rateIndex: null },
            flight: null,
            customFlight: null,
            otherServices: { transfer_selected_id: null, visa_selected_id: null }
        };

        // Find Makkah hotel default selection
        if (data?.makkah_hotel?.rooms) {
            for (let roomIndex = 0; roomIndex < data.makkah_hotel.rooms.length; roomIndex++) {
                const room = data.makkah_hotel.rooms[roomIndex];
                for (let rateIndex = 0; rateIndex < room.rates.length; rateIndex++) {
                    if (room.rates[rateIndex].selected_for_package === true) {
                        defaultSelections.makkahHotel = { roomIndex, rateIndex };
                        break;
                    }
                }
                if (defaultSelections.makkahHotel.roomIndex !== null) break;
            }
        }

        // Find Madinah hotel default selection
        if (data?.madinah_hotel?.rooms) {
            for (let roomIndex = 0; roomIndex < data.madinah_hotel.rooms.length; roomIndex++) {
                const room = data.madinah_hotel.rooms[roomIndex];
                for (let rateIndex = 0; rateIndex < room.rates.length; rateIndex++) {
                    if (room.rates[rateIndex].selected_for_package === true) {
                        defaultSelections.madinahHotel = { roomIndex, rateIndex };
                        break;
                    }
                }
                if (defaultSelections.madinahHotel.roomIndex !== null) break;
            }
        }

        // Default flight selection (if exists)
        if (data?.flight?.data?.offer?.id) {
            defaultSelections.flight = data.flight.data.offer.id;
        }
            // Default other services selection
        if (data?.transfer_selected_id !== null) {
            defaultSelections.otherServices.transfer_selected_id = Number(data.transfer_selected_id);
        }

        if (data?.visa_selected_id !== null) {
            defaultSelections.otherServices.visa_selected_id = Number(data.visa_selected_id);
        }

        return defaultSelections;
    }, [packageId]);

    // Fetch package data
    const fetchPackageData = useCallback(async () => {
        if (!packageId) return;

        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/api/customized/packages/details`, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    // 'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ 'package_id': packageId })
            });
            const response = await res.json();
            if (response.Success) {
                const data = response.Content;
                setPackageData(data);
                // Check if we have stored selections
                const storedSelections = loadSelectionsFromStorage(packageId);
                
                if (storedSelections) {
                    // Restore from session storage
                    setSelections(storedSelections);
                } else {
                    // Initialize with default selections from API
                    const defaultSelections = initializeDefaultSelections(data);
                    setSelections(defaultSelections);
                    saveSelectionsToStorage(defaultSelections);
                }
            } else {
                console.error('API returned unsuccessful response:', response);
                setPackageData(null);
            }
        } catch (error) {
            console.error('Error fetching package data:', error);
            console.error('Error details:', error.message);
            setPackageData(null);
        } finally {
            setIsLoading(false);
        }
    }, [packageId, loadSelectionsFromStorage, initializeDefaultSelections, saveSelectionsToStorage]);

    // Fetch data on mount or when packageId changes
    useEffect(() => {
        fetchPackageData();
    }, [fetchPackageData]);

    // Update Makkah hotel selection
    const updateMakkahHotelSelection = useCallback((roomIndex, rateIndex) => {
        setSelections(prev => {
            const updated = {
                ...prev,
                makkahHotel: { roomIndex, rateIndex }
            };
            saveSelectionsToStorage(updated);
            return updated;
        });
    }, [saveSelectionsToStorage]);

    // Update Madinah hotel selection
    const updateMadinahHotelSelection = useCallback((roomIndex, rateIndex) => {
        setSelections(prev => {
            const updated = {
                ...prev,
                madinahHotel: { roomIndex, rateIndex }
            };
            saveSelectionsToStorage(updated);
            return updated;
        });
    }, [saveSelectionsToStorage]);

    // Update flight selection
    const updateFlightSelection = useCallback((flightId, flightData = null) => {
        setSelections(prev => {
            const updated = {
                ...prev,
                flight: flightId,
                customFlight: flightData // Store full flight object
            };
            saveSelectionsToStorage(updated);
            return updated;
        });
    }, [saveSelectionsToStorage]);

    // Update other services selection
    const updateOtherServicesSelection = useCallback((services) => {
        setSelections(prev => {
            const updated = {
                ...prev,
                otherServices: services
            };
            saveSelectionsToStorage(updated);
            return updated;
        });
    }, [saveSelectionsToStorage]);

    // Get selected room and rate for a hotel
    const getSelectedHotelRate = useCallback((hotelType) => {
        if (!packageData) return null;

        const hotel = hotelType === 'makkah' ? packageData.makkah_hotel : packageData.madinah_hotel;
        const selection = hotelType === 'makkah' ? selections.makkahHotel : selections.madinahHotel;

        if (!hotel || selection.roomIndex === null || selection.rateIndex === null) return null;

        const room = hotel.rooms?.[selection.roomIndex];
        const rate = room?.rates?.[selection.rateIndex];

        return { room, rate };
    }, [packageData, selections]);

    // Clear all selections (useful for starting fresh)
    const clearSelections = useCallback(() => {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        if (packageData) {
            const defaultSelections = initializeDefaultSelections(packageData);
            setSelections(defaultSelections);
        }
    }, [packageData, initializeDefaultSelections]);

    const value = {
        // Data
        packageData,
        isLoading,
        selections,
        // Actions
        updateMakkahHotelSelection,
        updateMadinahHotelSelection,
        updateFlightSelection,
        updateOtherServicesSelection,
        clearSelections,
        refetchPackageData: fetchPackageData,
        
        // Helpers
        getSelectedHotelRate
    };

    return (
        <UmrahPackageContext.Provider value={value}>
            {children}
        </UmrahPackageContext.Provider>
    );
};

export const useUmrahPackage = () => {
    const context = useContext(UmrahPackageContext);
    if (context === undefined) {
        throw new Error('useUmrahPackage must be used within a UmrahPackageProvider');
    }
    return context;
};
