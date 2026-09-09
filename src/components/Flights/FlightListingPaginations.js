'use client';
import React from 'react';
import { useFlightList } from './FlightListingContext';
import UmrahPagination from '@/components/UmrahGetAway/Listing/UmrahPagination';

export default function FlightListingPaginations() {
  const { hasMore, loadMore } = useFlightList();
  return <UmrahPagination hasMore={hasMore} onLoadMore={loadMore} />;
}
