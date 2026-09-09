'use client'
import React from 'react'
import { useFilters } from './FilterContext';

export default function ResetFilter({ variant = 'link', setActiveDrawer }) {
  const { resetFilters } = useFilters();

  const handleReset = () => {
    if (typeof setActiveDrawer === 'function') {
      setActiveDrawer(null);
    }
    resetFilters();
  };

  if (variant === 'link') {
    return (
      <button type="button" className="hotel-filter-clear-all" onClick={handleReset}>
        Clear all
      </button>
    );
  }

  return (
    <div className="hotel-filter-reset">
      <button type="button" className="hotel-filter-reset__btn" onClick={handleReset}>
        Clear all
      </button>
    </div>
  );
}
