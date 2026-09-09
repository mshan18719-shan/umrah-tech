"use client";
import { useEffect } from "react";
import { createContext, useContext, useState, useMemo } from "react";
const TransferListContext = createContext();
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";

export function TransferListProvider({ children, transfers }) {
    const [convertedTransfers, setConvertedTransfers] = useState([]);
    const [search, setSearch] = useState(null);
    const { currency, rates } = useCurrency();
    
    // Filter states
    const [vehicleCategory, setVehicleCategory] = useState([]);
    const [transmissionType, setTransmissionType] = useState([]);
    const [passengerCapacity, setPassengerCapacity] = useState([]);
    const [luggageCapacity, setLuggageCapacity] = useState([]);
    const [sort, setSort] = useState("price-asc");
    
    // Price range states
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [resetPrice, setResetPrice] = useState(0);
    const [priceRange, setPriceRange] = useState([0, 0]);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Available options
    const [vehicleNames, setVehicleNames] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableTransmissions, setAvailableTransmissions] = useState([]);

    // Convert transfers prices to selected currency
    useEffect(() => {
        if (transfers && transfers.length > 0) {
            const transferListNew = transfers.map((item) => {
                const { newcurrency, newprice } = ConvertPrice(
                    item.fare, 
                    item.currency, 
                    currency, 
                    rates
                );
                return {
                    ...item,
                    convertedCurrency: newcurrency,
                    convertedPrice: newprice,
                };
            });

            // Set price range
            const prices = transferListNew.map((t) => t?.convertedPrice);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setMinPrice(min);
            setMaxPrice(max);
            setPriceRange([min, max]);

            // Extract unique values for filters
            const vehicleNames = [...new Set(transferListNew.map((t) => t.vehicle_details?.name))];
            const categories = [...new Set(transferListNew.map((t) => t.vehiclecategory?.name))];
            const transmissions = [...new Set(transferListNew.map((t) => t.vehicle_details?.transmission_type))];

            setVehicleNames(vehicleNames);
            setAvailableCategories(categories);
            setAvailableTransmissions(transmissions);
            setConvertedTransfers(transferListNew);
        } else {
            setConvertedTransfers([]);
        }
    }, [transfers, rates, currency]);

    const resetFilters = () => {
        setSearch(null);
        setVehicleCategory([]);
        setTransmissionType([]);
        setPassengerCapacity([]);
        setLuggageCapacity([]);
        setSort("price-asc");
        setPriceRange([minPrice, maxPrice]);
        setResetPrice(resetPrice + 1);
        setCurrentPage(1);
    };

    const filteredTransfers = useMemo(() => {
        let result = [...convertedTransfers];

        // Search by vehicle name
        if (search !== null && search !== '') {
            result = result.filter((t) =>
                t.vehicle_details?.name?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Price filter
        result = result.filter(
            (t) => t.convertedPrice >= priceRange[0] && t.convertedPrice <= priceRange[1]
        );

        // Vehicle Category filter
        if (vehicleCategory.length > 0) {
            result = result.filter((t) =>
                vehicleCategory.includes(t.vehiclecategory?.name)
            );
        }

        // Transmission Type filter
        if (transmissionType.length > 0) {
            result = result.filter((t) =>
                transmissionType.includes(t.vehicle_details?.transmission_type)
            );
        }

        // Passenger Capacity filter
        if (passengerCapacity.length > 0) {
            result = result.filter((t) => {
                const capacity = t.vehicle_details?.passenger_capacity;
                return passengerCapacity.some(range => {
                    if (range === '1-4') return capacity >= 1 && capacity <= 4;
                    if (range === '5-7') return capacity >= 5 && capacity <= 7;
                    if (range === '8-12') return capacity >= 8 && capacity <= 12;
                    if (range === '12+') return capacity > 12;
                    return false;
                });
            });
        }

        // Luggage Capacity filter
        if (luggageCapacity.length > 0) {
            result = result.filter((t) => {
                const capacity = t.vehicle_details?.luggage_capacity;
                return luggageCapacity.some(range => {
                    if (range === '1-2') return capacity >= 1 && capacity <= 2;
                    if (range === '3-4') return capacity >= 3 && capacity <= 4;
                    if (range === '5-6') return capacity >= 5 && capacity <= 6;
                    if (range === '6+') return capacity > 6;
                    return false;
                });
            });
        }
        // Sort
        if (sort === "price-asc") result.sort((a, b) => a?.convertedPrice - b?.convertedPrice);
        if (sort === "price-desc") result.sort((a, b) => b?.convertedPrice - a?.convertedPrice);
        if (sort === "name-asc") result.sort((a, b) => a.vehicle_details?.name?.localeCompare(b.vehicle_details?.name));

        return result;
    }, [convertedTransfers, search, priceRange, vehicleCategory, transmissionType, passengerCapacity, luggageCapacity, sort]);

    const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
    const paginatedTransfers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransfers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransfers, currentPage]);

    return (
        <TransferListContext.Provider
            value={{
                transfers: paginatedTransfers,
                totalTransfers: filteredTransfers.length,
                setSearch,
                setPriceRange,
                setVehicleCategory,
                setTransmissionType,
                setPassengerCapacity,
                setLuggageCapacity,
                setSort,
                totalPages,
                currentPage,
                setCurrentPage,
                itemsPerPage,
                minPrice,
                maxPrice,
                sort,
                vehicleCategory,
                transmissionType,
                passengerCapacity,
                luggageCapacity,
                search,
                priceRange,
                vehicleNames,
                availableCategories,
                availableTransmissions,
                resetPrice,
                resetFilters,
            }}
        >
            {children}
        </TransferListContext.Provider>
    );
}

export function useTransferList() {
    return useContext(TransferListContext);
}
