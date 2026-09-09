'use client'
import React, { useMemo, useState, useEffect } from "react";
import { RangeSlider, Checkbox, Drawer } from "@mantine/core";
import { IoTimeOutline } from "react-icons/io5";
import { MdTune } from "react-icons/md";
import { LiaAngleDownSolid } from "react-icons/lia";
import styles from "./Activities.module.css";

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

// IMPORTANT: these are defined OUTSIDE FilterSection so their identity stays
// stable across renders. Defining a component inside another component's
// render body creates a brand-new function (and therefore a brand-new
// component type) on every render, which forces React to unmount + remount
// it instead of just re-rendering it. For a draggable RangeSlider, that
// remount-per-render was exactly what broke dragging: the value updated
// correctly on every onChange, but the slider itself was being torn down
// and rebuilt on every single frame of the drag, so it never visually
// tracked the mouse smoothly.

function PricePanel({ value, onChange, onChangeEnd, min, max, currency }) {
  const formatPrice = (v) => `${currency} ${Math.round(v).toLocaleString()}`;

  return (
    <div>
      <p className={styles.sidebarFilterTitle}>Price Per Person</p>
      <RangeSlider
        className={styles.budgetSlider}
        value={value}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        min={min}
        max={max}
        step={1}
        minRange={1}
        color="#1B3B6F"
        label={null}
      />
      <div className={styles.priceLabels}>
        <span>{formatPrice(value[0])}</span>
        <span>Up to {formatPrice(value[1])}</span>
      </div>
    </div>
  );
}

function DurationPanel({ durationFilters, activeFilters, onToggle }) {
  return (
    <div>
      <p className={styles.sidebarFilterTitle}>Duration</p>
      <div className={styles.sidebarCheckList}>
        {durationFilters.length === 0 ? (
          <p className={styles.sidebarEmpty}>No durations available</p>
        ) : (
          durationFilters.map(({ duration, count }) => {
            const id = `duration_${duration}`;
            const checked = activeFilters.includes(id);
            return (
              <Checkbox
                key={duration}
                checked={checked}
                onChange={() => onToggle(duration)}
                className={styles.sidebarCheckbox}
                label={
                  <span className={styles.sidebarCheckLabel}>
                    <IoTimeOutline className={styles.sidebarCheckIcon} />
                    <span>{duration}</span>
                    <span className={styles.sidebarCheckCount}>({count})</span>
                  </span>
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function SortPanel({ sortBy, onSelect }) {
  return (
    <div>
      <p className={styles.sidebarFilterTitle}>Sort By</p>
      <div className={styles.sidebarSortList}>
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.sidebarSortOption} ${sortBy === option.value ? styles.sidebarSortOptionActive : ''}`}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterSection({
  activityList = [],
  priceRange,
  setPriceRange,
  activeFilters,
  setActiveFilters,
  currency = 'GBP',
  minPrice,
  maxPrice,
  sortBy = 'recommended',
  setSortBy,
}) {
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [draftPriceRange, setDraftPriceRange] = useState(priceRange);

  const durationFilters = useMemo(() => {
    const counts = {};
    activityList.forEach((activity) => {
      const duration = activity.activity_duration?.trim();
      if (duration) counts[duration] = (counts[duration] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([duration, count]) => ({ duration, count }));
  }, [activityList]);

  const isBudgetActive =
    minPrice !== undefined &&
    maxPrice !== undefined &&
    (priceRange[0] !== minPrice || priceRange[1] !== maxPrice);

  const isSortActive = sortBy !== 'recommended';
  const hasActiveFilters = isBudgetActive || isSortActive || activeFilters.length > 0;

  useEffect(() => {
    setDraftPriceRange(priceRange);
  }, [priceRange]);

  const safeMin = minPrice ?? 0;
  const safeMax = Math.max(safeMin + 1, maxPrice ?? 1000);
  const clampedDraft = [
    Math.min(Math.max(draftPriceRange[0] ?? safeMin, safeMin), safeMax),
    Math.min(Math.max(draftPriceRange[1] ?? safeMax, safeMin), safeMax),
  ];

  const toggleDuration = (duration) => {
    const id = `duration_${duration}`;
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const selectSort = (value) => {
    setSortBy(value);
    setActiveDrawer(null);
  };

  const clearAll = () => {
    setPriceRange([minPrice, maxPrice]);
    setDraftPriceRange([minPrice, maxPrice]);
    setActiveFilters([]);
    setSortBy('recommended');
    setActiveDrawer(null);
  };

  const applyBudgetFromDrawer = () => {
    setPriceRange(draftPriceRange);
    setActiveDrawer(null);
  };

  if (!activityList.length) return null;

  return (
    <>
      {/* Mobile filter pills */}
      <div className={`${styles.filterScroll} d-flex gap-2 d-md-none mb-3`}>
        <button type="button" onClick={() => setActiveDrawer('price')} className={styles.filterPill}>
          Price <span className={styles.filterPillArrow}><LiaAngleDownSolid /></span>
        </button>
        <button type="button" onClick={() => setActiveDrawer('duration')} className={styles.filterPill}>
          Duration <span className={styles.filterPillArrow}><LiaAngleDownSolid /></span>
        </button>
        <button type="button" onClick={() => setActiveDrawer('sort')} className={styles.filterPill}>
          Sort By <span className={styles.filterPillArrow}><LiaAngleDownSolid /></span>
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={clearAll} className={`${styles.filterPill} ${styles.filterPillClear}`}>
            Clear
          </button>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className={`${styles.filterSidebar} d-none d-md-flex`}>
        <div className={styles.filterPanel}>
          <div className={styles.filterSidebarHeader}>
            <div className={styles.filterSidebarHeaderLeft}>
              <MdTune className={styles.filterSidebarIcon} size={20} aria-hidden="true" />
              <p className={styles.filterSidebarTitle}>Filters</p>
            </div>
            {hasActiveFilters && (
              <button type="button" className={styles.clearAllBtn} onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className={styles.filterPanel}>
          <PricePanel
            value={clampedDraft}
            onChange={setDraftPriceRange}
            onChangeEnd={setPriceRange}
            min={safeMin}
            max={safeMax}
            currency={currency}
          />
        </div>

        {durationFilters.length > 0 && (
          <div className={styles.filterPanel}>
            <DurationPanel
              durationFilters={durationFilters}
              activeFilters={activeFilters}
              onToggle={toggleDuration}
            />
          </div>
        )}

        <div className={styles.filterPanel}>
          <SortPanel sortBy={sortBy} onSelect={selectSort} />
        </div>
      </div>

      {/* Mobile drawers */}
      <Drawer
        opened={activeDrawer === 'price'}
        onClose={() => {
          setDraftPriceRange(priceRange);
          setActiveDrawer(null);
        }}
        title="Price Per Person"
        position="bottom"
        size="48%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
        classNames={{ content: styles.filterDrawer }}
      >
        <PricePanel
          value={clampedDraft}
          onChange={setDraftPriceRange}
          onChangeEnd={() => {}}
          min={safeMin}
          max={safeMax}
          currency={currency}
        />
        <div className={styles.drawerActions}>
          <button type="button" className={styles.drawerDoneBtn} onClick={applyBudgetFromDrawer}>
            Apply
          </button>
          <button
            type="button"
            className={styles.drawerResetBtn}
            onClick={() => {
              const reset = [minPrice, maxPrice];
              setDraftPriceRange(reset);
              setPriceRange(reset);
              setActiveDrawer(null);
            }}
          >
            Reset
          </button>
        </div>
      </Drawer>

      <Drawer
        opened={activeDrawer === 'duration'}
        onClose={() => setActiveDrawer(null)}
        title="Duration"
        position="bottom"
        size="50%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
        classNames={{ content: styles.filterDrawer }}
      >
        <DurationPanel
          durationFilters={durationFilters}
          activeFilters={activeFilters}
          onToggle={toggleDuration}
        />
        <div className={styles.drawerActions}>
          <button type="button" className={styles.drawerDoneBtn} onClick={() => setActiveDrawer(null)}>
            Done
          </button>
        </div>
      </Drawer>

      <Drawer
        opened={activeDrawer === 'sort'}
        onClose={() => setActiveDrawer(null)}
        title="Sort By"
        position="bottom"
        size="40%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
        classNames={{ content: styles.filterDrawer }}
      >
        <SortPanel sortBy={sortBy} onSelect={selectSort} />
        <div className={styles.drawerActions}>
          <button type="button" className={styles.drawerDoneBtn} onClick={() => setActiveDrawer(null)}>
            Done
          </button>
        </div>
      </Drawer>
    </>
  );
}

export default FilterSection;