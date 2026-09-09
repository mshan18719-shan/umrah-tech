'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useTransferList } from '../TransferListingContext'

export default function LuggageCapacityFilter() {
  const { luggageCapacity, setLuggageCapacity } = useTransferList();

  const capacityRanges = [
    { value: '1-2', label: '1-2 Bags' },
    { value: '3-4', label: '3-4 Bags' },
    { value: '5-6', label: '5-6 Bags' },
    { value: '6+', label: '6+ Bags' }
  ];

  const handleCheckboxChange = (value) => {
    if (luggageCapacity.includes(value)) {
      setLuggageCapacity(luggageCapacity.filter((c) => c !== value));
    } else {
      setLuggageCapacity([...luggageCapacity, value]);
    }
  };

  return (
    <div className="hotel-filter-section">
      <p className='hotel-filter-section__label'>Luggage Capacity</p>
      <div className="hotel-filter-checkbox-group">
        {capacityRanges.map((range, index) => (
          <Checkbox
            key={index}
            checked={luggageCapacity.includes(range.value)}
            onChange={() => handleCheckboxChange(range.value)}
            className='hotel-filter-checkbox'
            label={range.label}
          />
        ))}
      </div>
    </div>
  )
}
