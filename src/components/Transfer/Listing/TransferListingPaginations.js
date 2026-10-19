'use client';
import React from 'react';
import { useTransferList } from "./TransferListingContext";
import UmrahPagination from '@/components/UmrahGetAway/Listing/UmrahPagination';

export default function TransferPaginations() {
  const { hasMore, loadMore } = useTransferList();
  return <UmrahPagination hasMore={hasMore} onLoadMore={loadMore} />;
}
