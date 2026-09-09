'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { FaStar } from 'react-icons/fa';
import { useHotelList } from '../HotelListingContext'

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

export default function StarFilter() {
  const { star, setStar } = useHotelList();

  const handleCheckboxChange = (value) => {
    if (star.includes(value)) {
      setStar(star.filter((s) => s !== value));
    } else {
      setStar([...star, value]);
    }
  };

  return (
    <div className="hotel-filter-section">
      <p className="hotel-filter-section__label">Property Rating</p>
      <div className="hotel-filter-checkbox-group">
        <Checkbox
          checked={star.includes(5)}
          onChange={() => handleCheckboxChange(5)}
          className="hotel-filter-checkbox"
          label={<StarLabel count={5} />}
        />
        <Checkbox
          checked={star.includes(4)}
          onChange={() => handleCheckboxChange(4)}
          className="hotel-filter-checkbox"
          label={<StarLabel count={4} />}
        />
        <Checkbox
          checked={star.includes(3)}
          onChange={() => handleCheckboxChange(3)}
          className="hotel-filter-checkbox"
          label={<StarLabel count={3} />}
        />
        <Checkbox
          checked={star.includes(2)}
          onChange={() => handleCheckboxChange(2)}
          className="hotel-filter-checkbox"
          label={<StarLabel count={2} />}
        />
        <Checkbox
          checked={star.includes(1)}
          onChange={() => handleCheckboxChange(1)}
          className="hotel-filter-checkbox"
          label={<StarLabel count={1} />}
        />
        <Checkbox
          checked={star.includes(0)}
          onChange={() => handleCheckboxChange(0)}
          className="hotel-filter-checkbox"
          label={<StarLabel text="Unrated" />}
        />
      </div>
    </div>
  )
}
