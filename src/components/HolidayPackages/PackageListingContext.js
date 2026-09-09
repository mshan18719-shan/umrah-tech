"use client";
import { useEffect } from "react";
import { createContext, useContext, useState, useMemo } from "react";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";

const PackageListContext = createContext();

export function PackageListProvider({ children, packages }) {
    const [convertedPackages, setConvertedPackages] = useState([]);
    const [search, setSearch] = useState(null);
    const { currency, rates } = useCurrency();
    const [star, setStar] = useState([]);
    const [hotelNames, setHotelNames] = useState([]);
    const [sort, setSort] = useState("price-asc");
    const [meal, setMeal] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [resetPrice, setResetPrice] = useState(0);
    const [priceRange, setPriceRange] = useState([0, 0]);
    const [visibleCount, setVisibleCount] = useState(10);
    const itemsPerPage = 10;

    useEffect(() => {
        if (packages && packages.length > 0) {
            const packageListNew = packages.map((item) => {
                const { newcurrency, newprice } = ConvertPrice(
                    item.total_price,
                    item.currency,
                    currency,
                    rates
                );
                return {
                    ...item,
                    'displayCurrency': newcurrency,
                    'displayPrice': newprice,
                };
            });

            const prices = packageListNew.map((p) => p?.displayPrice);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setMinPrice(min);
            setMaxPrice(max);
            setPriceRange([min, max]);

            const hotelNames = [...new Set(packageListNew.map((p) => p?.hotel?.name).filter(Boolean))];
            setHotelNames(hotelNames);
            setConvertedPackages(packageListNew);
        } else {
            setConvertedPackages([]);
        }
    }, [packages, rates, currency]);

    const resetFilters = () => {
        setSearch(null);
        setStar([]);
        setMeal([]);
        setSort("price-asc");
        setPriceRange([minPrice, maxPrice]);
        setResetPrice(resetPrice + 1);
        setVisibleCount(10);
    };

    const filteredPackages = useMemo(() => {
        let result = [...convertedPackages];

        // Search by hotel name
        if (search !== null && search !== '') {
            result = result.filter((p) =>
                p?.hotel?.name?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Price range
        result = result.filter(
            (p) => p.displayPrice >= priceRange[0] && p.displayPrice <= priceRange[1]
        );

        // Star Rating
        if (star.length > 0) {
            result = result.filter((p) => {
                const starValue = Math.round(Number(p?.hotel?.metadata?.stars));
                const isNumericStar = !isNaN(starValue) && starValue >= 1 && starValue <= 5;

                // If star includes 0 → allow hotels with non-numeric or out-of-range star values
                if (star.includes(0) && (!isNumericStar)) {
                    return true;
                }

                // Otherwise, normal 1–5 filtering
                return star.includes(starValue);
            });
        }

        // Meal Type
        if (meal.length > 0) {
            result = result.filter((p) =>
                p?.hotel?.rooms?.some((room) =>
                    room.rates?.some((rate) =>
                        meal.includes(rate.board_name?.toLowerCase())
                    )
                )
            );
        }

        // Sort
        if (sort === "price-asc") result.sort((a, b) => a?.displayPrice - b?.displayPrice);
        if (sort === "price-desc") result.sort((a, b) => b?.displayPrice - a?.displayPrice);
        if (sort === "name-asc") result.sort((a, b) => a?.hotel?.name?.localeCompare(b?.hotel?.name));

        return result;
    }, [convertedPackages, search, priceRange, star, meal, sort]);

    useEffect(() => {
        setVisibleCount(10);
    }, [search, star, meal, priceRange, sort, convertedPackages.length]);

    const visiblePackages = useMemo(() => {
        return filteredPackages.slice(0, visibleCount);
    }, [filteredPackages, visibleCount]);

    const hasMore = visibleCount < filteredPackages.length;

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + itemsPerPage, filteredPackages.length));
    };

    return (
        <PackageListContext.Provider
            value={{
                packages: visiblePackages,
                totalPackages: filteredPackages.length,
                setSearch,
                setPriceRange,
                setStar,
                setSort,
                setMeal,
                hasMore,
                loadMore,
                itemsPerPage,
                minPrice,
                maxPrice,
                sort,
                star,
                meal,
                search,
                priceRange,
                hotelNames,
                resetPrice,
                resetFilters,
            }}
        >
            {children}
        </PackageListContext.Provider>
    );
}

export function usePackageList() {
    return useContext(PackageListContext);
}
