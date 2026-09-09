'use client';
import React from 'react';
import { usePackageList } from './PackageListingContext';
import UmrahPagination from '@/components/UmrahGetAway/Listing/UmrahPagination';

export default function PackageListingPaginations() {
    const { hasMore, loadMore } = usePackageList();
    return <UmrahPagination hasMore={hasMore} onLoadMore={loadMore} />;
}
