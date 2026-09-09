'use client';

import React from 'react';
import { Select } from '@mantine/core';
import { LiaAngleDownSolid } from 'react-icons/lia';

/**
 * Package listing sort control (mirrors hotel results topbar sort UI).
 * Sorts client-side by package starting price / title.
 */
export default function PackageSort({ sort, setSort }) {
    return (
        <Select
            value={sort}
            onChange={(value) => setSort(value || "price-asc")}
            placeholder="Sort packages"
            aria-label="Sort packages"
            allowDeselect={false}
            checkIconPosition="right"
            rightSection={<LiaAngleDownSolid size={14} aria-hidden="true" />}
            rightSectionPointerEvents="none"
            data={[
                { value: "price-asc", label: "Low to High" },
                { value: "price-desc", label: "High to Low" },
                { value: "name-asc", label: "Name: A-Z" },
            ]}
            classNames={{
                root: "package-results-sort",
                input: "hotel-results-sort",
            }}
        />
    );
}

/** Lowest per-person sale price used for sorting cards */
export function getPackageSortPrice(item) {
    const validPrices =
        item?.price_Details?.filter((p) => p.type !== 'without_beds') || [];
    if (validPrices.length === 0) return Number.POSITIVE_INFINITY;

    return validPrices.reduce(
        (min, p) =>
            Number(p.sale_per_person) < min ? Number(p.sale_per_person) : min,
        Number(validPrices[0]?.sale_per_person) || Number.POSITIVE_INFINITY
    );
}

export function sortPackages(list, sortKey) {
    const result = [...(list || [])];

    if (sortKey === 'price-asc') {
        result.sort((a, b) => getPackageSortPrice(a) - getPackageSortPrice(b));
    } else if (sortKey === 'price-desc') {
        result.sort((a, b) => getPackageSortPrice(b) - getPackageSortPrice(a));
    } else if (sortKey === 'name-asc') {
        result.sort((a, b) =>
            String(a?.title || '').localeCompare(String(b?.title || ''))
        );
    }

    return result;
}
