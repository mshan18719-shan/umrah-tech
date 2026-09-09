'use client'
import React, { useEffect, useState } from 'react'
import { MdFilterListAlt } from "react-icons/md";
import { Checkbox, RangeSlider, Select } from "@mantine/core";
import { useSearchParams, useRouter } from "next/navigation";
import { DatePicker } from '@mantine/dates';
import moment from 'moment';
import PackageFilterLoader from '@/components/Loader/PackageFilterLoader';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { useCurrency } from '@/util/currency';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { LiaAngleDownSolid } from "react-icons/lia";
import { Drawer } from "@mantine/core";
export default function Filter() {
    const searchParams = useSearchParams();
    const URLCity = searchParams.get('city');
    const router = useRouter();
    const [isDesktop, setIsDesktop] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState(null);
    const { currency, rates } = useCurrency();
    const [searchDate, setSearchDate] = useState(moment());
    const [categoryFilter, setCategoryFilter] = useState([]);
    const [cityFilter, setCityFilter] = useState([]);
    const [nameFilter, setNameFilter] = useState([]);
    const [ratingFilter, setRatingFilter] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 0]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedRating, setSelectedRating] = useState([]);
    const [selectedName, setSelectedName] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        getFilters();
    }, [URLCity]);
    useEffect(() => {
        const urlDate = searchParams.get('date');
        if (urlDate) setSearchDate(urlDate);

        const cityFromURL = searchParams.get('city');
        const categoryFromURL = searchParams.getAll('category_slug[]');
        const ratingFromURL = searchParams.getAll('rating_stars[]');
        const nameFromURL = searchParams.get('activity_name');
        const minPriceFromURL = searchParams.get('min_price');
        const maxPriceFromURL = searchParams.get('max_price');

        if (cityFromURL) setSelectedCity(cityFromURL);
        if (categoryFromURL.length > 0) setSelectedCategories(categoryFromURL);
        if (ratingFromURL.length > 0) setSelectedRating(ratingFromURL);
        if (nameFromURL) setSelectedName(nameFromURL);
        if (minPriceFromURL && maxPriceFromURL) {
            setPriceRange([Number(minPriceFromURL), Number(maxPriceFromURL)]);
        }
    }, [searchParams]);

    async function getFilters() {
        setIsLoading(true);
        const urlDate = searchParams.get('date');
        const urlCity = searchParams.get('city');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/filters?date=${urlDate || ''}&city=${urlCity || ''}`, {
                cache: 'no-store',
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true' 
                }
            });
            const response = await res.json();
            setIsLoading(false)
            if (response.Success) {
                const NameList = response.Content.activity_names.map((item) => ({
                    value: item.slug,
                    label: item.title,
                }));
                setNameFilter(NameList)
                setCategoryFilter(response.Content.categories);
                setCityFilter(response.Content.cities);
                setRatingFilter(response.Content.ratings);
                const { newcurrency: minCurrency, newprice: minPriceConverted } = ConvertPrice(response.Content?.price_range.min_price, response.Content?.currency_code, currency, rates);
                const { newcurrency: maxCurrency, newprice: maxPriceConverted } = ConvertPrice(response.Content?.price_range.max_price, response.Content?.currency_code, currency, rates);
                setPriceRange([minPriceConverted, maxPriceConverted]);
                setMinPrice(minPriceConverted);
                setMaxPrice(maxPriceConverted);
            }
        } catch (error) {
            setIsLoading(false)
            console.log(error)
        }
    }
    const handleDateChange = (date) => {
        const params = new URLSearchParams(searchParams);
        params.set('date', date);
        router.push(`?${decodeURIComponent(params.toString())}`)
    }

    const handleNameChange = (value) => {
        setSelectedName(value);
        const params = new URLSearchParams(searchParams);
        if (value === null) {
            params.delete('activity_name');
        } else {
            params.set('activity_name', value);
        }
        router.push(`?${decodeURIComponent(params.toString())}`)
    };

    const handleCategoryChange = (slug) => {
        const updated = selectedCategories.includes(slug)
            ? selectedCategories.filter((d) => d !== slug)
            : [...selectedCategories, slug];
        setSelectedCategories(updated);
        updateURL({ category_slug: updated })
    };

    const handleCityChange = (city) => {
        const updated = selectedCity === city ? null : city;
        setSelectedCity(updated);
        updateURL({ city: updated })
    };

    const handleRatingChange = (rating) => {
        const updated = selectedRating.includes(rating)
            ? selectedRating.filter((d) => d !== rating)
            : [...selectedRating, rating];
        setSelectedRating(updated);
        updateURL({ rating_stars: updated })
    };

    const handlePriceRangeChange = (value) => {
        setPriceRange(value);
    };

    const handlePriceRangeChangeEnd = (value) => {
        const params = new URLSearchParams(searchParams);
        params.set('min_price', value[0]);
        params.set('max_price', value[1]);
        router.push(`?${decodeURIComponent(params.toString())}`)
    };
    const updateURL = (newParams) => {
        const params = new URLSearchParams(searchParams);

        Object.entries(newParams).forEach(([key, value]) => {
            params.delete(`${key}[]`);

            if (Array.isArray(value)) {
                value.forEach((v) => {
                    if (v) params.append(`${key}[]`, v);
                });
            } else if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        router.push(`?${decodeURIComponent(params.toString())}`);
    };

    const handleResetFilters = () => {
        const params = new URLSearchParams(searchParams);
        
        // Keep only the date parameter, remove all other filters
        const dateParam = params.get('date');
        params.delete('city');
        params.delete('category_slug[]');
        params.delete('rating_stars[]');
        params.delete('activity_name');
        params.delete('min_price');
        params.delete('max_price');
        
        // Reset state
        setSelectedCity(null);
        setSelectedCategories([]);
        setSelectedRating([]);
        setSelectedName(null);
        setPriceRange([minPrice, maxPrice]);
        
        // Keep date in URL if it exists
        const newParams = dateParam ? `date=${dateParam}` : '';
        router.push(`?${newParams}`);
        
        // Close any open drawer
        setActiveDrawer(null);
    };

    useEffect(() => {
        // Check screen size on mount and resize
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    return (
        <div>
            {/* Mobile: Filter Pills */}
            <div className="filter-scroll d-flex gap-2 d-md-none mb-3" style={{ marginTop: '-19px' }}>
                <button onClick={() => setActiveDrawer('date')} className="filter-pill">
                    Date <span className="arrow"><LiaAngleDownSolid /></span>
                </button>

                <button onClick={() => setActiveDrawer('price')} className="filter-pill">
                    Price <span className="arrow"><LiaAngleDownSolid /></span>
                </button>

                <button onClick={() => setActiveDrawer('city')} className="filter-pill">
                    City <span className="arrow"><LiaAngleDownSolid /></span>
                </button>

                <button onClick={() => setActiveDrawer('category')} className="filter-pill">
                    Category <span className="arrow"><LiaAngleDownSolid /></span>
                </button>

                <button onClick={() => setActiveDrawer('rating')} className="filter-pill">
                    Rating <span className="arrow"><LiaAngleDownSolid /></span>
                </button>
            </div>
            <div className="filter_box rounded">
                <a
                    className="d-flex justify-content-between fw-bold align-items-center"
                    data-bs-toggle="collapse"
                    href="#collapseFilters"
                    aria-expanded={isDesktop}
                    aria-controls="collapseFilters"
                    id="filters_col_bt"
                >
                    Filters
                    <MdFilterListAlt />
                </a>
                {isLoading ? (
                    <PackageFilterLoader />
                ) : (
                    <div className={`collapse ${isDesktop ? 'show' : ''}`} id="collapseFilters">
                        <hr />
                        <div>
                            <p className="small fw-bold">Date</p>
                            <div className='package-date-filter'>
                                <DatePicker minDate={Date()} value={searchDate} onChange={handleDateChange} />
                            </div>
                        </div>
                        {/* Price Range Slider */}
                        <hr />
                        <div>
                            <p className="small fw-bold">Price Range</p>
                            <div>
                                <RangeSlider
                                    className="mb-3"
                                    pushOnOverlap={false}
                                    value={priceRange}
                                    onChange={handlePriceRangeChange}
                                    onChangeEnd={handlePriceRangeChangeEnd}
                                    min={minPrice}
                                    max={maxPrice}
                                    step={1}
                                    label={null}
                                />
                                <p className='mb-0'>Min: {currency} {Math.round(priceRange[0])}</p>
                                <p>Max: {currency} {Math.round(priceRange[1])}</p>
                            </div>
                        </div>
                        <hr />

                        {/* Activity Name Select */}
                        {/* <div>
                        <p className="small fw-bold">Activity Name</p>
                        <div>
                            <Select 
                                searchable 
                                 clearable="true" 
                                data={nameFilter} 
                                value={selectedName} 
                                onChange={handleNameChange} 
                                placeholder='Select Activity' 
                            />
                        </div>
                    </div>
                    <hr /> */}

                        {/* Cities Checkboxes */}
                        {cityFilter.length > 0 && (
                            <>
                                <div>
                                    <p className="small fw-bold">City</p>
                                    <div>
                                        {cityFilter.map((city, index) => (
                                            <Checkbox
                                                key={index}
                                                onChange={() => handleCityChange(city.city)}
                                                checked={selectedCity === city.city}
                                                className="mt-2"
                                                label={`${city.city} (${city.count})`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <hr />
                            </>
                        )}

                        {/* Categories Checkboxes */}
                        {categoryFilter.length > 0 && (
                            <>
                                <div>
                                    <p className="small fw-bold">Category</p>
                                    <div>
                                        {categoryFilter.map((category) => (
                                            <Checkbox
                                                key={category.id}
                                                onChange={() => handleCategoryChange(category.slug)}
                                                checked={selectedCategories.includes(category.slug)}
                                                className="mt-2"
                                                label={`${category.name} (${category.count})`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <hr />
                            </>
                        )}

                        {/* Ratings Checkboxes - Dynamic */}
                        {ratingFilter.length > 0 && (
                            <>
                                <div>
                                    <p className="small fw-bold">Rating</p>
                                    <div>
                                        {ratingFilter.map((ratingItem, index) => (
                                            <Checkbox
                                                key={index}
                                                onChange={() => handleRatingChange(ratingItem.rating.toString())}
                                                checked={selectedRating.includes(ratingItem.rating.toString())}
                                                className="mt-2"
                                                label={
                                                    <span className="d-flex align-items-center gap-1">
                                                        {[...Array(Math.floor(ratingItem.rating))].map((_, i) => (
                                                            <FaStar key={i} className="text-warning" />
                                                        ))}
                                                        {ratingItem.rating % 1 !== 0 && (
                                                            <FaStarHalfAlt className="text-warning" />
                                                        )}
                                                        <span className="ms-1">({ratingItem.count})</span>
                                                    </span>
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                        <hr />
                        <div className="text-center">
                            <button className="btn btn-outline-danger w-100" onClick={handleResetFilters}>
                                Reset All Filters
                            </button>
                        </div>

                    </div>
                )}
            </div>
            <Drawer
                opened={activeDrawer === 'date'}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="65%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
            >
                <div>
                    <p className="small fw-bold">Date</p>
                    <div className='package-date-filter'>
                        <DatePicker minDate={Date()} value={searchDate} onChange={handleDateChange} />
                    </div>
                </div>
                <div className="border-top pt-3 mt-3">
                    <button
                        className="btn btn-success w-100 mb-2"
                        onClick={() => setActiveDrawer(null)}
                    >
                        Done
                    </button>
                    <button
                        className="btn btn-outline-danger w-100"
                        onClick={handleResetFilters}
                    >
                        Reset All Filters
                    </button>
                </div>
            </Drawer>
            <Drawer
                opened={activeDrawer === 'price'}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="38%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
            >
                <div>
                    <p className="small fw-bold">Price Range</p>
                    <div>
                        <RangeSlider
                            className="mb-3"
                            pushOnOverlap={false}
                            value={priceRange}
                            onChange={handlePriceRangeChange}
                            onChangeEnd={handlePriceRangeChangeEnd}
                            min={minPrice}
                            max={maxPrice}
                            step={1}
                            label={null}
                        />
                        <p className='mb-0'>Min: {currency} {Math.round(priceRange[0])}</p>
                        <p>Max: {currency} {Math.round(priceRange[1])}</p>
                    </div>
                </div>
                <div className="border-top pt-3 mt-3">
                    <button
                        className="btn btn-success w-100 mb-2"
                        onClick={() => setActiveDrawer(null)}
                    >
                        Done
                    </button>
                    <button
                        className="btn btn-outline-danger w-100"
                        onClick={handleResetFilters}
                    >
                        Reset All Filters
                    </button>
                </div>
            </Drawer>
            <Drawer
                opened={activeDrawer === 'city'}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="35%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
            >
                <div>
                    <p className="small fw-bold">City</p>
                    <div>
                        {cityFilter.map((city, index) => (
                            <Checkbox
                                key={index}
                                onChange={() => handleCityChange(city.city)}
                                checked={selectedCity === city.city}
                                className="mt-2"
                                label={`${city.city} (${city.count})`}
                            />
                        ))}
                    </div>
                </div>
                <div className="border-top pt-3 mt-3">
                    <button
                        className="btn btn-success w-100 mb-2"
                        onClick={() => setActiveDrawer(null)}
                    >
                        Done
                    </button>
                    <button
                        className="btn btn-outline-danger w-100"
                        onClick={handleResetFilters}
                    >
                        Reset All Filters
                    </button>
                </div>
            </Drawer>
            <Drawer
                opened={activeDrawer === 'category'}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="42%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
            >
                <div>
                    <p className="small fw-bold">Category</p>
                    <div>
                        {categoryFilter.map((category) => (
                            <Checkbox
                                key={category.id}
                                onChange={() => handleCategoryChange(category.slug)}
                                checked={selectedCategories.includes(category.slug)}
                                className="mt-2"
                                label={`${category.name} (${category.count})`}
                            />
                        ))}
                    </div>
                </div>
                <div className="border-top pt-3 mt-3">
                    <button
                        className="btn btn-success w-100 mb-2"
                        onClick={() => setActiveDrawer(null)}
                    >
                        Done
                    </button>
                    <button
                        className="btn btn-outline-danger w-100"
                        onClick={handleResetFilters}
                    >
                        Reset All Filters
                    </button>
                </div>
            </Drawer>
            <Drawer
                opened={activeDrawer === 'rating'}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="50%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
            >
                <div>
                    <p className="small fw-bold">Rating</p>
                    <div>
                        {ratingFilter.map((ratingItem, index) => (
                            <Checkbox
                                key={index}
                                onChange={() => handleRatingChange(ratingItem.rating.toString())}
                                checked={selectedRating.includes(ratingItem.rating.toString())}
                                className="mt-2"
                                label={
                                    <span className="d-flex align-items-center gap-1">
                                        {[...Array(Math.floor(ratingItem.rating))].map((_, i) => (
                                            <FaStar key={i} className="text-warning" />
                                        ))}
                                        {ratingItem.rating % 1 !== 0 && (
                                            <FaStarHalfAlt className="text-warning" />
                                        )}
                                        <span className="ms-1">({ratingItem.count})</span>
                                    </span>
                                }
                            />
                        ))}
                    </div>
                </div>
                <div className="border-top pt-3 mt-3">
                    <button
                        className="btn btn-success w-100 mb-2"
                        onClick={() => setActiveDrawer(null)}
                    >
                        Done
                    </button>
                    <button
                        className="btn btn-outline-danger w-100"
                        onClick={handleResetFilters}
                    >
                        Reset All Filters
                    </button>
                </div>
            </Drawer>
        </div>
    )
}
