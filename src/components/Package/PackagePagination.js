'use client';
import React from 'react';
import UmrahPagination from '@/components/UmrahGetAway/Listing/UmrahPagination';

/** @deprecated Prefer UmrahPagination directly — kept for any leftover imports */
export default function PackagePagination({ hasMore, onLoadMore }) {
  return <UmrahPagination hasMore={hasMore} onLoadMore={onLoadMore} />;
}
