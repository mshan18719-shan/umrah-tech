'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFilters } from './FilterContext';

export default function ViewFilter({ city = 'makkah' }) {
  const {
    makkahHaramView,
    setMakkahHaramView,
    makkahKaabaView,
    setMakkahKaabaView,
    madinahHaramView,
    setMadinahHaramView
  } = useFilters();

  if (city === 'makkah') {
    return (
      <div className="hotel-filter-section">
        <p className="hotel-filter-section__label">Special Views</p>
        <div className="hotel-filter-checkbox-group">
          <Checkbox
            className="hotel-filter-checkbox"
            label="Haram View"
            checked={makkahHaramView}
            onChange={(e) => setMakkahHaramView(e.currentTarget.checked)}
          />
          <Checkbox
            className="hotel-filter-checkbox"
            label="Kaaba View"
            checked={makkahKaabaView}
            onChange={(e) => setMakkahKaabaView(e.currentTarget.checked)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-filter-section">
      <p className="hotel-filter-section__label">Special Views</p>
      <div className="hotel-filter-checkbox-group">
        <Checkbox
          className="hotel-filter-checkbox"
          label="Haram View"
          checked={madinahHaramView}
          onChange={(e) => setMadinahHaramView(e.currentTarget.checked)}
        />
      </div>
    </div>
  );
}
