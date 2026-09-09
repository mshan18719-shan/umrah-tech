'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PackageCard from './PackageCard';
import PackageCardLoader from '../Loader/PackageCardLoader';
import { useSearchParams, useParams } from 'next/navigation';
import PackagePagination from './PackagePagination';
import Link from 'next/link';
import { FaHome } from 'react-icons/fa';
import { Playfair } from 'next/font/google';
import Filter from './Filter';
import PackageSort, { sortPackages } from './PackageSort';

const playfair = Playfair({
    weight: '700',
    subsets: ['latin'],
});

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
    const [progress, setProgress] = useState(0);
    const [sort, setSort] = useState('price-asc');

    const resolvedSlug =
        category_slug === 'umrah-packages'
            ? category_slug
            : category_slug || params?.slug;

    useEffect(() => {
        async function getPackages() {
            setIsLoading(true);
            setProgress(0);
            const progressInterval = setInterval(() => {
                setProgress((prev) => (prev < 90 ? prev + 10 : prev));
            }, 200);
            try {
                const query = searchParams.toString();
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
                    setPackageResponse(response?.Content);
                    setPackageList(response?.Content?.packages || []);
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
    }, [searchParams, resolvedSlug]);

    const sortedPackages = useMemo(
        () => sortPackages(packageList, sort),
        [packageList, sort]
    );

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
                                    <h3 className={playfair.className}>No Packages Found</h3>
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
                                    <PackageCard packageList={sortedPackages} />
                                    {packageResponse?.pagination?.last_page > 1 && (
                                        <PackagePagination pdata={packageResponse.pagination} />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
