'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useTransferList } from '../TransferListingContext'

export default function PassengerCapacityFilter() {
  const { passengerCapacity, setPassengerCapacity } = useTransferList();

  const capacityRanges = [
    { value: '1-4', label: '1-4 Passengers' },
    { value: '5-7', label: '5-7 Passengers' },
    { value: '8-12', label: '8-12 Passengers' },
    { value: '12+', label: '12+ Passengers' }
  ];

  const handleCheckboxChange = (value) => {
    if (passengerCapacity.includes(value)) {
      setPassengerCapacity(passengerCapacity.filter((c) => c !== value));
    } else {
      setPassengerCapacity([...passengerCapacity, value]);
    }
  };

  return (
    <div className="hotel-filter-section">
      <p className='hotel-filter-section__label'>Passenger Capacity</p>
      <div className="hotel-filter-checkbox-group">
        {capacityRanges.map((range, index) => (
          <Checkbox
            key={index}
            checked={passengerCapacity.includes(range.value)}
            onChange={() => handleCheckboxChange(range.value)}
            className='hotel-filter-checkbox'
            label={range.label}
          />
        ))}
      </div>
    </div>
  )
}
