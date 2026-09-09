'use client'
import React from 'react'
import SearchBar from './SearchBar';
import Rating from './Rating';
import PriceRange from './PriceRange';
import { FaAngleDown } from 'react-icons/fa';
import ViewFilter from './ViewFilter';
import DistanceFilter from './DistanceFilter';
import styles from './UmrahFilter.module.css';

export default function Main({ isDesktop }) {
  return (
    <>
      <div className="hotel-filter-panel">
        <PriceRange />
      </div>

      <div className="hotel-filter-panel">
        <a
          className={styles.cityToggle}
          data-bs-toggle="collapse"
          href="#collapseMakkahFilters"
          aria-expanded="true"
          aria-controls="collapseMakkahFilters"
        >
          <span className="hotel-filter-section__label" style={{ margin: 0 }}>Makkah Hotels</span>
          <FaAngleDown className={styles.chevron} />
        </a>
        <div className={`collapse ${isDesktop ? 'show' : ''} ${styles.cityPanel}`} id="collapseMakkahFilters">
          <SearchBar city="makkah" />
          <Rating city="makkah" />
          <DistanceFilter city="makkah" />
          <ViewFilter city="makkah" />
        </div>
      </div>

      <div className="hotel-filter-panel">
        <a
          className={styles.cityToggle}
          data-bs-toggle="collapse"
          href="#collapseMadinahFilters"
          aria-expanded="true"
          aria-controls="collapseMadinahFilters"
        >
          <span className="hotel-filter-section__label" style={{ margin: 0 }}>Madinah Hotels</span>
          <FaAngleDown className={styles.chevron} />
        </a>
        <div className={`collapse ${isDesktop ? 'show' : ''} ${styles.cityPanel}`} id="collapseMadinahFilters">
          <SearchBar city="madinah" />
          <Rating city="madinah" />
          <DistanceFilter city="madinah" />
          <ViewFilter city="madinah" />
        </div>
      </div>
    </>
  )
}
