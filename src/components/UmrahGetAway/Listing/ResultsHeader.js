'use client'
import React from 'react'
import { Select } from '@mantine/core'
import { HiOutlineFunnel } from 'react-icons/hi2'
import { useFilters } from './Filter/FilterContext'
import styles from './ResultsHeader.module.css'
import { FaAngleDown } from 'react-icons/fa'

const SORT_OPTIONS = [
  { value: 'default', label: 'Recommended' },
  { value: 'nearest_makkah', label: 'Hotels Near Kaaba' },
  { value: 'nearest_madinah', label: 'Hotels Near Masjid an-Nabawi' },
];

function getJourneySubtext(searchData) {
  const journey = searchData?.journey_type;
  if (journey === 'madinahFirst') {
    return 'Showing Madinah → Makkah itineraries with flights and ATOL protection';
  }
  if (journey === 'makkahFirst') {
    return 'Showing Makkah → Madinah itineraries with flights and ATOL protection';
  }
  return 'Showing Umrah itineraries with flights and ATOL protection';
}

export default function ResultsHeader({ count, searchData }) {
  const { sortBy, setSortBy } = useFilters();
  const packageLabel = count === 1 ? 'package' : 'packages';

  return (
    <div className={styles.resultsHeader}>
      <div className={styles.countBlock}>
        <h2 className={styles.countTitle}>
          <span className={styles.countBold}>{count} {packageLabel}</span>{' '}
          <span className={styles.countItalic}>found for your search</span>
        </h2>
        <p className={styles.countSubtext}>{getJourneySubtext(searchData)}</p>
      </div>

      <div className={styles.sortBlock}>
        {/* <span className={styles.sortIcon} aria-hidden="true">
          <HiOutlineFunnel size={15} />
        </span> */}
        {/* <span className={styles.sortLabel}>Sort:</span> */}
        <Select
          className={styles.sortSelect}
          variant="unstyled"
          value={sortBy}
          onChange={setSortBy}
          data={SORT_OPTIONS}
          allowDeselect={false}
          rightSection={<FaAngleDown size={16} />}
          comboboxProps={{ withinPortal: true ,  width: 'auto', position: 'bottom-end' }}
        />
      </div>
    </div>
  );
}
