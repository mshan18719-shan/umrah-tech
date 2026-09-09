'use client';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { MdEdit, MdLocationOn, MdPeople } from 'react-icons/md';
import Index from '@/components/Transfer/Listing/Index';
import { TransferListProvider, useTransferList } from '@/components/Transfer/Listing/TransferListingContext';
import TransferListingLoader from '../../components/Loader/TransferListingLoader';
import TransferSearch from '@/components/Home/Search/TransferSearch';
import { PackageModeBanner } from '@/components/Store/PackageModeHelper';
import moment from 'moment';
import heroStyles from '@/components/Transfer/TransferListingHero.module.css';

function TransferResultsTopBar({ isLoading, searchParams }) {
    const { totalTransfers, sort, setSort } = useTransferList();

    if (isLoading || totalTransfers === 0) return null;

    const routeLabel =
        searchParams?.transferType === 'all-round'
            ? (searchParams?.pickupLocation || 'Transfers')
            : [searchParams?.pickupLocation, searchParams?.dropoffLocation].filter(Boolean).join(' → ') || 'Transfers';

    return (
        <div className="hotel-results-topbar transfer-results-topbar">
            <div className="hotel-results-left">
                <p className="hotel-results-count mb-0">
                    <strong>
                        {totalTransfers} {totalTransfers > 1 ? 'Transfers' : 'Transfer'}
                    </strong>
                    <span className="hotel-results-subtext"> found for your search</span>
                </p>
                <p className="hotel-results-caption mb-0">Showing {routeLabel}</p>
            </div>
            <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="form-select hotel-results-sort"
                aria-label="Sort transfers"
            >
                <option value="price-asc">Low to High</option>
                <option value="price-desc">High to Low</option>
                <option value="name-asc">Name: A-Z</option>
            </select>
        </div>
    );
}

function TransferPageContent() {
    const searchParams = useSearchParams();
    // Convert to normal object
    const params = Object.fromEntries(searchParams.entries());

    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    const getTransfers = async (params) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/transfers/search`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'ngrok-skip-browser-warning': 'true',
                    },
                    cache: 'no-store',
                    body: JSON.stringify(params),
                }
            );

            const data = await res.json();
            return data?.data?.transfers || [];
        } catch (error) {
            console.error('Error fetching transfers:', error);
            return [];
        }
    };

    useEffect(() => {
        // if (!params?.fromLat || !params?.toLat) return;

        const fetchData = async () => {
            setLoading(true);
            const result = await getTransfers(params);
            setTransfers(result);
            setLoading(false);
        };

        fetchData();
    }, [searchParams]); // re-run when URL changes

    return (
        <div className="transfer-listing-page">
            <PackageModeBanner serviceName="transfer" />

            {/* Mobile: compact summary + collapsible search */}
            <div className='d-block d-md-none'>
                <div className='msb-bar'>
                    <div
                        className='d-flex align-items-center gap-3 cursor-pointer'
                        onClick={() => setShowMobileSearch(prev => !prev)}
                    >
                        <div className='msb-icon'>
                            <MdLocationOn size={20} color="#1B3B6F" />
                        </div>
                        <div className='flex-grow-1' style={{ minWidth: 0 }}>
                            <div className='msb-title'>
                                {params?.pickupLocation || 'Search Transfers'}
                                {params?.dropoffLocation && (
                                    <span className='msb-title-secondary'> → {params.dropoffLocation}</span>
                                )}
                            </div>
                            <div className='msb-subtitle'>
                                <MdPeople size={12} className='msb-subtitle-icon' />
                                {params?.passengers
                                    ? `${params.passengers} Passenger${Number(params.passengers) !== 1 ? 's' : ''}`
                                    : 'Tap to search'}
                                {params?.pickupDate && (
                                    <span className='msb-subtitle-date'>· {moment(params.pickupDate).format('DD-MM-YYYY')}</span>
                                )}
                            </div>
                        </div>
                        {!params?.packageMode && !params?.edit &&
                            <button
                                onClick={e => { e.stopPropagation(); setShowMobileSearch(prev => !prev); }}
                                className='msb-modify-btn'
                            >
                                <MdEdit size={13} />
                                Modify
                            </button>
                        }
                    </div>
                </div>

                <div
                    className='msb-collapse'
                    style={{ maxHeight: showMobileSearch ? '900px' : '0' }}
                >
                    <div className='msb-collapse-inner'>
                        <TransferSearch variant="listing" onSearch={() => setShowMobileSearch(false)} />
                    </div>
                </div>
            </div>

            {/* Desktop: hero image + overlapping search */}
            {!params?.packageMode && !params?.edit && (
                <div className={`${heroStyles.heroSection} d-none d-md-block`}>
                    <div className={heroStyles.heroImageWrap}>
                        <Image
                            src="/images/transfersbg.jpg"
                            alt="Transfer search"
                            fill
                            priority
                            sizes="100vw"
                            className={heroStyles.heroImage}
                            quality={75}
                        />
                        <div className={heroStyles.heroOverlay} aria-hidden="true" />
                        <div className={`container ${heroStyles.heroTitleWrap}`}>
                            <h1 className={heroStyles.heroTitle}>Transfers</h1>
                        </div>
                    </div>
                    <div className={heroStyles.searchPanel}>
                        <div className="container">
                            <div className={heroStyles.searchCard}>
                                <TransferSearch variant="listing" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? <TransferListingLoader /> : (
                <div className='container mb-5 transfer-listing-results'>
                    <TransferListProvider transfers={transfers}>
                        <TransferResultsTopBar isLoading={loading} searchParams={params} />
                        <Index searchParams={params} />
                    </TransferListProvider>
                </div>
            )}
        </div>
    )
}

export default function page() {
    return (
        <Suspense fallback={<TransferListingLoader />}>
            <TransferPageContent />
        </Suspense>
    );
}
