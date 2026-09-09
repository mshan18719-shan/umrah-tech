'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { usePackageList } from '../PackageListingContext'

export default function StarFilter() {
  const { star, setStar } = usePackageList();

  const handleCheckboxChange = (value) => {
    if (star.includes(value)) {
      // Remove if already selected
      setStar(star.filter((s) => s !== value));
    } else {
      // Add if not selected
      setStar([...star, value]);
    }
  };

  return (
    <div>
      <p className='small fw-bold'>Hotel Rating</p>
      <div>
        <Checkbox checked={star.includes(5)} onChange={() => handleCheckboxChange(5)} className='mt-2' label="5 Stars" />
        <Checkbox checked={star.includes(4)} onChange={() => handleCheckboxChange(4)} className='mt-2' label="4 Stars" />
        <Checkbox checked={star.includes(3)} onChange={() => handleCheckboxChange(3)} className='mt-2' label="3 Stars" />
        <Checkbox checked={star.includes(2)} onChange={() => handleCheckboxChange(2)} className='mt-2' label="2 Stars" />
        <Checkbox checked={star.includes(1)} onChange={() => handleCheckboxChange(1)} className='mt-2' label="1 Star" />
        <Checkbox checked={star.includes(0)} onChange={() => handleCheckboxChange(0)} className='mt-2' label="Other" />
      </div>
    </div>
  )
}
