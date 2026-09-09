'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';

export default function FlightClass() {
    const { selectedCabinClass, setSelectedCabinClass, cabinClassesWithCounts, setCurrentPage } = useFlightList();

    const handleClassChange = (className) => {
        setSelectedCabinClass(prev => {
            if (prev.includes(className)) {
                return prev.filter(c => c !== className);
            } else {
                return [...prev, className];
            }
        });
        setCurrentPage(1);
    };

    return (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">Cabin</p>
            <div className="hotel-filter-checkbox-group">
                {cabinClassesWithCounts.map((cabinClass) => (
                    <Checkbox
                        key={cabinClass.name}
                        className="hotel-filter-checkbox"
                        label={
                            <span className="flight-filter-checkbox-label">
                                <span>{cabinClass.name}</span>
                                <span className="flight-filter-checkbox-count">{cabinClass.count}</span>
                            </span>
                        }
                        checked={selectedCabinClass.includes(cabinClass.name)}
                        onChange={() => handleClassChange(cabinClass.name)}
                    />
                ))}
            </div>
        </div>
    )
}
