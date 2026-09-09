'use client';
import React from 'react';
import { useHotelList } from "./HotelListingContext";
import UmrahPagination from '@/components/UmrahGetAway/Listing/UmrahPagination';

export default function HotelListingPaginations() {
  const { hasMore, loadMore } = useHotelList();
  return <UmrahPagination hasMore={hasMore} onLoadMore={loadMore} />;
}
