'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DateInput } from '@mantine/dates';
import { Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaRegListAlt, FaSearch } from 'react-icons/fa';
import { usePackageCategories } from '@/contexts/PackageCategoriesContext';
import homeStyles from './FlightSearchHome.module.css';
import listingStyles from './UmrahGetAwayListing.module.css';
import styles from './PackageSearch.module.css';

function formatDateParam(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return value;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseDateParam(value) {
    if (!value) return null;

    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function PackageSearch({
    categoryList = [],
    defaultCategory = '',
    initialDate = '',
    variant = 'home',
    onSearch,
}) {
    const isListing = variant === 'listing';
    const { categories: contextCategories } = usePackageCategories();
    const categories = categoryList.length > 0 ? categoryList : contextCategories;

    const [formData, setFormData] = useState({
        category: defaultCategory || '',
        date: parseDateParam(initialDate),
    });
    const router = useRouter();
    const dateInputRef = useRef(null);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            category: defaultCategory || prev.category,
            date: parseDateParam(initialDate) ?? prev.date,
        }));
    }, [defaultCategory, initialDate]);

    const handleCategoryChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            category: value || "",
        }));

        if (value !== '') {
            dateInputRef.current?.focus();
        }
    };

    const handleDateChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            date: value,
        }));
    };

    const handleSubmit = () => {
        if (formData.category === '') {
            notifications.show({
                title: 'Error',
                message: 'Category is required',
                autoClose: 2000,
                color: 'red',
            });
            return;
        }
        if (formData.date === null) {
            notifications.show({
                title: 'Error',
                message: 'Date is required',
                autoClose: 2000,
                color: 'red',
            });
            return;
        }
        router.push(`/${formData.category}?date=${formatDateParam(formData.date)}`);
        onSearch?.();
    };

    const categorySelect = (
        <Select
            id={isListing ? 'package-category-listing' : 'package-category'}
            placeholder="Select package category"
            value={formData.category}
            onChange={handleCategoryChange}
            aria-label="Package category"
            searchable
            nothingFoundMessage="No category found"
            data={categories.map((item) => ({
                value: item.slug,
                label: item.name,
            }))}
            classNames={{
                input: isListing
                    ? styles.listingSelect
                    : styles.categorySelect,
            }}
        />
    );

    const dateInput = (
        <DateInput
            ref={dateInputRef}
            variant="unstyled"
            placeholder="Select date"
            valueFormat="MMM DD, ddd"
            value={formData.date}
            onChange={handleDateChange}
            onFocus={(e) => e.target.select()}
            minDate={new Date()}
        />
    );

    if (isListing) {
        return (
            <div className={listingStyles.wrapper}>
                <div className={listingStyles.searchRow}>
                    <div className={listingStyles.inputSearches}>
                        <div className={listingStyles.fieldsCard}>
                            <div className={listingStyles.fieldsRow}>
                                <div className={`${listingStyles.listingField} ${styles.listingCategoryField}`}>
                                    <div className={`${listingStyles.fieldIcon} ${listingStyles.iconNavy}`}>
                                        <FaRegListAlt />
                                    </div>
                                    <div className={listingStyles.fieldBody}>
                                        <span className={listingStyles.fieldLabel}>Category</span>
                                        <div className={listingStyles.fieldValue}>{categorySelect}</div>
                                    </div>
                                </div>

                                <div className={listingStyles.listingField}>
                                    <div className={`${listingStyles.fieldIcon} ${listingStyles.iconNavy}`}>
                                        <FaCalendarAlt />
                                    </div>
                                    <div className={listingStyles.fieldBody}>
                                        <span className={listingStyles.fieldLabel}>Departure Date</span>
                                        <div className={listingStyles.fieldValue}>{dateInput}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button type="button" className={listingStyles.searchBtn} onClick={handleSubmit}>
                            Search
                            <FaSearch aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={homeStyles.wrapper}>
            <div className={homeStyles.searchBar}>
                <div className={homeStyles.fieldsRow}>
                    <div className={`${homeStyles.dateField} ${styles.categoryField}`}>
                        <div className={homeStyles.dateFieldHeader}>
                            <FaRegListAlt />
                            <span>Category</span>
                        </div>
                        <div className={homeStyles.dateFieldValue}>{categorySelect}</div>
                    </div>

                    <div className={homeStyles.fieldDivider} />

                    <div className={homeStyles.dateField}>
                        <div className={homeStyles.dateFieldHeader}>
                            <FaCalendarAlt />
                            <span>Departure</span>
                        </div>
                        <div className={homeStyles.dateFieldValue}>{dateInput}</div>
                    </div>
                </div>

                <button type="button" className={homeStyles.searchBtn} onClick={handleSubmit}>
                    Search
                </button>
            </div>
        </div>
    );
}
