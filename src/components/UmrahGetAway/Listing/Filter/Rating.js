'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { FaStar } from 'react-icons/fa';
import { useFilters } from './FilterContext';

function StarLabel({ count, text }) {
  if (text) {
    return <span className="hotel-filter-star-label__text">{text}</span>;
  }

  return (
    <span className="hotel-filter-star-label" aria-label={`${count} stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <FaStar key={i} className="hotel-filter-star-label__icon" aria-hidden="true" />
      ))}
    </span>
  );
}

export default function Rating({ city = 'makkah' }) {
  const {
    makkahRatings,
    setMakkahRatings,
    madinahRatings,
    setMadinahRatings
  } = useFilters();

  const selectedRatings = city === 'makkah' ? makkahRatings : madinahRatings;
  const setRatings = city === 'makkah' ? setMakkahRatings : setMadinahRatings;

  const ratingOptions = [
    { value: 5, label: <StarLabel count={5} /> },
    { value: 4, label: <StarLabel count={4} /> },
    { value: 3, label: <StarLabel count={3} /> },
    { value: 2, label: <StarLabel count={2} /> },
    { value: 1, label: <StarLabel count={1} /> },
    { value: 0, label: <StarLabel text="Unrated" /> },
  ];

  const handleChange = (value) => {
    if (selectedRatings.includes(value)) {
      setRatings(selectedRatings.filter(r => r !== value));
    } else {
      setRatings([...selectedRatings, value]);
    }
  };

  return (
    <div className="hotel-filter-section">
      <p className="hotel-filter-section__label">Property Rating</p>
      <div className="hotel-filter-checkbox-group">
        {ratingOptions.map(option => (
          <Checkbox
            key={option.value}
            className="hotel-filter-checkbox"
            label={option.label}
            checked={selectedRatings.includes(option.value)}
            onChange={() => handleChange(option.value)}
          />
        ))}
      </div>
    </div>
  )
}
