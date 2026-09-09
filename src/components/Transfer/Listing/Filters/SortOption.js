'use client'
import React from 'react'
import { useTransferList } from '../TransferListingContext'

export default function SortOption() {
    const { sort, setSort } = useTransferList();
    
    return (
        <div>
            <p className='hotel-filter-section__label'>Order By</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-select hotel-filter-select">
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Vehicle Name: A-Z</option>
            </select>
        </div>
    )
}
