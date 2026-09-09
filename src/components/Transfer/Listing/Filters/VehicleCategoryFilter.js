'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useTransferList } from '../TransferListingContext'

export default function VehicleCategoryFilter() {
  const { vehicleCategory, setVehicleCategory, availableCategories } = useTransferList();

  const handleCheckboxChange = (value) => {
    if (vehicleCategory.includes(value)) {
      setVehicleCategory(vehicleCategory.filter((c) => c !== value));
    } else {
      setVehicleCategory([...vehicleCategory, value]);
    }
  };

  return (
    <div className="hotel-filter-section">
      <p className='hotel-filter-section__label'>Vehicle Category</p>
      <div className="hotel-filter-checkbox-group">
        {availableCategories.map((category, index) => (
          <Checkbox
            key={index}
            checked={vehicleCategory.includes(category)}
            onChange={() => handleCheckboxChange(category)}
            className='hotel-filter-checkbox'
            label={category?.charAt(0).toUpperCase() + category?.slice(1)}
          />
        ))}
      </div>
    </div>
  )
}
