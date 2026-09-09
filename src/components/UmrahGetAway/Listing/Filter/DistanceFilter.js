'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFilters } from './FilterContext';

export default function DistanceFilter({ city = 'makkah' }) {
  const {
    makkahDistances,
    setMakkahDistances,
    madinahDistances,
    setMadinahDistances
  } = useFilters();

  const selectedDistances = city === 'makkah' ? makkahDistances : madinahDistances;
  const setDistances = city === 'makkah' ? setMakkahDistances : setMadinahDistances;
  const haramLabel = city === 'madinah' ? 'Nabawi' : 'Haram';

  const distanceOptions = [
    { value: '0-500', label: '0 – 500 m' },
    { value: '500-1000', label: '501 m – 1 km' },
    { value: '1000-2000', label: '1 km – 2 km' },
    { value: '2000+', label: 'More than 2 km' },
    { value: 'unknown', label: 'Not specified' }
  ];

  const handleChange = (value) => {
    if (selectedDistances.includes(value)) {
      setDistances(selectedDistances.filter(d => d !== value));
    } else {
      setDistances([...selectedDistances, value]);
    }
  };

  return (
    <div className="hotel-filter-section">
      <p className="hotel-filter-section__label">Distance From {haramLabel}</p>
      <div className="hotel-filter-checkbox-group">
        {distanceOptions.map(option => (
          <Checkbox
            key={option.value}
            className="hotel-filter-checkbox"
            label={option.label}
            checked={selectedDistances.includes(option.value)}
            onChange={() => handleChange(option.value)}
          />
        ))}
      </div>
    </div>
  )
}
