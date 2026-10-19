'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PackageCard from './PackageCard';
import PackageCardLoader from '../Loader/PackageCardLoader';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { FaHome } from 'react-icons/fa';
import Filter from './Filter';
import PackageSort, { sortPackages } from './PackageSort';
import UmrahPagination from '@/components/UmrahGetAway/Listing/UmrahPagination';

function formatCategoryLabel(slug) {
    if (!slug) return 'packages';
    return slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default function PackageList({ category_slug }) {
    const searchParams = useSearchParams();
    const params = useParams();
    const [packageResponse, setPackageResponse] = useState({});
    const [packageList, setPackageList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [progress, setProgress] = useState(0);
    const [sort, setSort] = useState('price-asc');
    const [visibleCount, setVisibleCount] = useState(10);
    const [apiPage, setApiPage] = useState(1);
    const [lastApiPage, setLastApiPage] = useState(1);
    const itemsPerPage = 10;
    const loadingMoreRef = useRef(false);

    const resolvedSlug =
        category_slug === 'umrah-packages'
            ? category_slug
            : category_slug || params?.slug;

    const buildQuery = useCallback(
        (page) => {
            const queryParams = new URLSearchParams(searchParams.toString());
            queryParams.delete('_ts');
            queryParams.delete('page');
            queryParams.set('page', String(page));
            return queryParams.toString();
        },
        [searchParams]
    );

    useEffect(() => {
        async function getPackages() {
            setIsLoading(true);
            setProgress(0);
            setVisibleCount(10);
            setApiPage(1);
            setLastApiPage(1);
            setPackageList([]);
            const progressInterval = setInterval(() => {
                setProgress((prev) => (prev < 90 ? prev + 10 : prev));
            }, 200);
            try {
                const query = buildQuery(1);
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/packages/search?category_slug=${resolvedSlug}${query ? `&${query}` : ''}`,
                    {
                        cache: 'no-store',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                const response = await res.json();
                clearInterval(progressInterval);
                setProgress(100);
                setIsLoading(false);
                if (response.Success) {
                    const content = response?.Content || {};
                    const pagination = content?.pagination || {};
                    setPackageResponse(content);
                    setPackageList(content?.packages || []);
                    setApiPage(Number(pagination.current_page) || 1);
                    setLastApiPage(Number(pagination.last_page) || 1);
                } else {
                    setPackageResponse({});
                    setPackageList([]);
                }
            } catch (error) {
                clearInterval(progressInterval);
                setIsLoading(false);
                console.log(error);
            }
        }
        getPackages();
    }, [searchParams, resolvedSlug, buildQuery]);

    const sortedPackages = useMemo(
        () => sortPackages(packageList, sort),
        [packageList, sort]
    );

    useEffect(() => {
        setVisibleCount(10);
    }, [sort, searchParams, resolvedSlug]);

    const visiblePackages = useMemo(
        () => sortedPackages.slice(0, visibleCount),
        [sortedPackages, visibleCount]
    );

    const hasMoreLocal = visibleCount < sortedPackages.length;
    const hasMoreApi = apiPage < lastApiPage;
    const hasMore = hasMoreLocal || hasMoreApi;

    const loadMore = useCallback(async () => {
        if (hasMoreLocal) {
            setVisibleCount((prev) => Math.min(prev + itemsPerPage, sortedPackages.length));
            return;
        }

        if (!hasMoreApi || loadingMoreRef.current) return;

        loadingMoreRef.current = true;
        setIsLoadingMore(true);
        try {
            const nextPage = apiPage + 1;
            const query = buildQuery(nextPage);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/packages/search?category_slug=${resolvedSlug}${query ? `&${query}` : ''}`,
                {
                    cache: 'no-store',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const response = await res.json();
            if (response.Success) {
                const content = response?.Content || {};
                const pagination = content?.pagination || {};
                const nextPackages = content?.packages || [];
                setPackageList((prev) => [...prev, ...nextPackages]);
                setApiPage(Number(pagination.current_page) || nextPage);
                setLastApiPage(Number(pagination.last_page) || lastApiPage);
                setPackageResponse(content);
                setVisibleCount((prev) => prev + Math.min(itemsPerPage, nextPackages.length || itemsPerPage));
            }
        } catch (error) {
            console.log(error);
        } finally {
            loadingMoreRef.current = false;
            setIsLoadingMore(false);
        }
    }, [
        hasMoreLocal,
        hasMoreApi,
        sortedPackages.length,
        apiPage,
        lastApiPage,
        buildQuery,
        resolvedSlug,
        itemsPerPage,
    ]);

    const total = packageResponse?.pagination?.total ?? packageList.length;
    const categoryLabel = formatCategoryLabel(resolvedSlug);

    return (
        <div className="container my-3 package-listing-page">
            {!isLoading && packageList.length > 0 && (
                <div className="package-listing-topbar">
                    <div className="hotel-results-left">
                        <p className="hotel-results-count mb-0">
                            <strong>
                                {total} {total === 1 ? 'Package' : 'Packages'}
                            </strong>
                            <span className="hotel-results-subtext"> found for your search</span>
                        </p>
                        <p className="hotel-results-caption mb-0">
                            Showing {categoryLabel}
                        </p>
                    </div>
                    <PackageSort sort={sort} setSort={setSort} />
                </div>
            )}

            <div className="row">
                <div className="col-xl-3 col-md-12 col-sm-12 col-12">
                    <Filter category_slug={resolvedSlug} />
                </div>
                <div className="col-xl-9 col-md-12 col-sm-12 col-12 my-3">
                    {isLoading ? (
                        <div>
                            <div className="hotel-search-loader mb-3">
                                <div className="hotel-search-loader__header">
                                    <div
                                        className="hotel-search-loader__spinner"
                                        role="status"
                                        aria-label="Loading"
                                    >
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <div className="hotel-search-loader__text">
                                        <p className="hotel-search-loader__title">
                                            Searching Packages
                                        </p>
                                        <p className="hotel-search-loader__subtitle">
                                            Finding the best packages for you…
                                        </p>
                                    </div>
                                    <span className="hotel-search-loader__percent">{progress}%</span>
                                </div>
                                <div className="hotel-search-loader__track">
                                    <div
                                        className="hotel-search-loader__bar"
                                        role="progressbar"
                                        aria-valuenow={progress}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                            <PackageCardLoader />
                        </div>
                    ) : (
                        <div>
                            {packageList.length === 0 ? (
                                <div className="text-center packge-card-notfound">
                                    <h3 className="font-playfair">No Packages Found</h3>
                                    <p>
                                        We couldn’t find any packages matching your search criteria.
                                        Try adjusting your filters or search again with different
                                        dates.
                                    </p>
                                    <Link href="/">
                                        <button type="button" className="btn btn-success mx-1">
                                            <FaHome /> Go Back Home
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <div>
                                    <PackageCard packageList={visiblePackages} />
                                    <UmrahPagination
                                        hasMore={hasMore || isLoadingMore}
                                        onLoadMore={loadMore}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
