'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useHotelList } from '../HotelListingContext';

export default function DistanceFilter() {
    const { distance, setDistance, distanceOptions, landmark } = useHotelList();

    if (!landmark) return null;

    const handleCheckboxChange = (value) => {
        if (distance.includes(value)) {
            setDistance(distance.filter((s) => s !== value));
        } else {
            setDistance([...distance, value]);
        }
    };

    return (
        <div className="hotel-filter-section">
            <p className='hotel-filter-section__label'>{landmark.filterTitle}</p>
            <div className="hotel-filter-checkbox-group">
                {distanceOptions.map((option) => (
                    <Checkbox
                        key={option.value}
                        checked={distance.includes(option.value)}
                        onChange={() => handleCheckboxChange(option.value)}
                        className='hotel-filter-checkbox'
                        label={option.label}
                    />
                ))}
            </div>
        </div>
    )
}
