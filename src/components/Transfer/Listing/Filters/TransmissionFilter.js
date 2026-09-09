'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useTransferList } from '../TransferListingContext'

export default function TransmissionFilter() {
  const { transmissionType, setTransmissionType, availableTransmissions } = useTransferList();

  const handleCheckboxChange = (value) => {
    if (transmissionType.includes(value)) {
      setTransmissionType(transmissionType.filter((t) => t !== value));
    } else {
      setTransmissionType([...transmissionType, value]);
    }
  };

  return (
    <div className="hotel-filter-section">
      <p className='hotel-filter-section__label'>Transmission Type</p>
      <div className="hotel-filter-checkbox-group">
        {availableTransmissions.map((transmission, index) => (
          <Checkbox
            key={index}
            checked={transmissionType.includes(transmission)}
            onChange={() => handleCheckboxChange(transmission)}
            className='hotel-filter-checkbox'
            label={transmission}
          />
        ))}
      </div>
    </div>
  )
}
