'use client';
import React, { useEffect, useState } from 'react';
import { Drawer } from '@mantine/core';
import { MdTune } from 'react-icons/md';
import { LiaAngleDownSolid } from 'react-icons/lia';

import { useTransferList } from './TransferListingContext';
import TransferInfo from './TransferInfo';
import TransferCard from './TransferCard';
import TransferListingPaginations from './TransferListingPaginations';

import SearchBar from './Filters/SearchBar';
import PriceRange from './Filters/PriceRange';
import VehicleCategoryFilter from './Filters/VehicleCategoryFilter';
import TransmissionFilter from './Filters/TransmissionFilter';
import PassengerCapacityFilter from './Filters/PassengerCapacityFilter';
import LuggageCapacityFilter from './Filters/LuggageCapacityFilter';
import ResetFilter from './Filters/ResetFilter';

import TransferListingLoader from '@/components/Loader/TransferListingLoader';

function FilterDrawer({ opened, onClose, title, size, children }) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position="bottom"
      size={size}
      overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
      transitionProps={{ duration: 200 }}
      withinPortal
      lockScroll
      trapFocus={false}
      classNames={{ content: 'hotel-filter-drawer transfer-filter-drawer' }}
    >
      <div className="mb-2" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
      <ResetFilter setActiveDrawer={onClose} />
      <div className="border-top pt-3 mt-3">
        <button type="button" className="hotel-filter-done-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </Drawer>
  );
}

export default function Index({ searchParams }) {
  const { transfers, totalTransfers } = useTransferList();
  const [isLoading, setIsLoading] = useState(true);
  const [activeDrawer, setActiveDrawer] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [totalTransfers]);

  const closeDrawer = () => setActiveDrawer(null);

  const desktopFilters = (
  <div className="hotel-filter-sidebar d-none d-md-flex">
    <div className="hotel-filter-panel-header">
      <div className="hotel-filter-sidebar__header">
        <div className="hotel-filter-sidebar__header-left">
          <MdTune className="hotel-filter-sidebar__icon" size={20} aria-hidden="true" />
          <p className="hotel-filter-sidebar__title">Filters</p>
        </div>
        <ResetFilter setActiveDrawer={setActiveDrawer} variant="link" />
      </div>
    </div>
    <div className="hotel-filter-panel">
      <SearchBar />
    </div>
    <div className="hotel-filter-panel">
      <PriceRange />
    </div>
    <div className="hotel-filter-panel">
      <VehicleCategoryFilter />
    </div>
    <div className="hotel-filter-panel">
      <TransmissionFilter />
    </div>
    <div className="hotel-filter-panel">
      <PassengerCapacityFilter />
    </div>
    <div className="hotel-filter-panel">
      <LuggageCapacityFilter />
    </div>
  </div>
  );

  return (
    <div className="row g-3">
      {/* Sidebar: transfer info + filters */}
      <div className="col-md-3 col-sm-12 col-12">
        {/* Mobile filter pills */}
        <div className="filter-scroll d-flex gap-2 d-md-none mb-3">
          <button
            type="button"
            onClick={() => setActiveDrawer('vehicle')}
            className={`filter-pill ${activeDrawer === 'vehicle' ? 'is-active' : ''}`}
          >
            Vehicle <span className="arrow"><LiaAngleDownSolid /></span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDrawer('price')}
            className={`filter-pill ${activeDrawer === 'price' ? 'is-active' : ''}`}
          >
            Price <span className="arrow"><LiaAngleDownSolid /></span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDrawer('category')}
            className={`filter-pill ${activeDrawer === 'category' ? 'is-active' : ''}`}
          >
            Category <span className="arrow"><LiaAngleDownSolid /></span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDrawer('transmission')}
            className={`filter-pill ${activeDrawer === 'transmission' ? 'is-active' : ''}`}
          >
            Transmission <span className="arrow"><LiaAngleDownSolid /></span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDrawer('capacity')}
            className={`filter-pill ${activeDrawer === 'capacity' ? 'is-active' : ''}`}
          >
            Capacity <span className="arrow"><LiaAngleDownSolid /></span>
          </button>
        </div>

        {/* Desktop transfer summary */}
        <div className="d-none d-md-block transfer-sidebar-info mb-3">
          <TransferInfo searchInfo={searchParams} />
        </div>

        {desktopFilters}

        {/* Mobile drawers */}
        <FilterDrawer
          opened={activeDrawer === 'vehicle'}
          onClose={closeDrawer}
          title="Search By Vehicle Name"
          size="42%"
        >
          <SearchBar />
        </FilterDrawer>

        <FilterDrawer
          opened={activeDrawer === 'price'}
          onClose={closeDrawer}
          title="Your Budget"
          size="48%"
        >
          <PriceRange />
        </FilterDrawer>

        <FilterDrawer
          opened={activeDrawer === 'category'}
          onClose={closeDrawer}
          title="Vehicle Category"
          size="50%"
        >
          <VehicleCategoryFilter />
        </FilterDrawer>

        <FilterDrawer
          opened={activeDrawer === 'transmission'}
          onClose={closeDrawer}
          title="Transmission Type"
          size="45%"
        >
          <TransmissionFilter />
        </FilterDrawer>

        <FilterDrawer
          opened={activeDrawer === 'capacity'}
          onClose={closeDrawer}
          title="Passenger & Luggage"
          size="58%"
        >
          <div className="d-flex flex-column gap-4">
            <PassengerCapacityFilter />
            <LuggageCapacityFilter />
          </div>
        </FilterDrawer>
      </div>

      {/* Results */}
      <div className="col-md-9 col-sm-12 col-12">
        {isLoading ? (
          <TransferListingLoader />
        ) : (
          <>
            <TransferCard transfers={transfers} searchParams={searchParams} />
            <TransferListingPaginations />
          </>
        )}
      </div>
    </div>
  );
}
