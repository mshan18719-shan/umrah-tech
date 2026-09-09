"use client";

import React from "react";
import Image from "next/image";
import styles from "./FlightListingSkeletonLoader.module.css";

function PlaneIcon() {
    return (
        <svg
            className={styles.planeIcon}
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
    );
}

function FilterSectionSkeleton({ delay = 0 }) {
    return (
        <div className={styles.filterSectionSkel} style={{ animationDelay: `${delay}ms` }}>
            <span className={styles.filterTitleSkel} />
            <div className={styles.filterBlockSkel} />
        </div>
    );
}

function FlightCardSkeleton({ delay = 0 }) {
    return (
        <div className={styles.flightCard} style={{ animationDelay: `${delay}ms` }}>
            <div className={styles.cardTopRow}>
                <span className={styles.stopPillSkel} />
                <span className={styles.dateSkel} />
            </div>

            <div className={styles.cardBody}>
                <div className={styles.airlineCol}>
                    <span className={styles.airlineLogoSkel} />
                    <div className={styles.airlineTextCol}>
                        <span className={styles.airlineNameSkel} />
                        <span className={styles.airlineSubSkel} />
                    </div>
                </div>

                <div className={styles.routeCol}>
                    <span className={styles.timeSkel} />

                    <div className={styles.pathWrap}>
                        <span className={styles.durationLabelSkel} />
                        <div className={styles.pathLine}>
                            <span className={styles.pathDot} />
                            <span className={styles.pathTrack}>
                                <PlaneIcon />
                            </span>
                            <span className={styles.pathDot} />
                        </div>
                        <span className={styles.stopLabelSkel} />
                    </div>

                    <span className={styles.timeSkel} />
                </div>

                <div className={styles.priceCol}>
                    <span className={styles.priceSkel} />
                    <span className={styles.taxSkel} />
                    <span className={styles.btnSkel} />
                </div>
            </div>
        </div>
    );
}

function SearchStatusBar() {
    return (
        <div className={styles.statusBar}>
            <div className={styles.statusLogoWrap}>
                <Image
                    src="/images/navlogo.png"
                    alt="UmrahTech"
                    width={128}
                    height={35}
                    className={styles.statusLogo}
                    priority
                />
            </div>
            <p className={styles.statusText}>
                Searching top deals from <span>500+ airlines</span>
            </p>
            <div className={styles.progressTrack} aria-hidden="true">
                <span className={styles.progressFill} />
            </div>
        </div>
    );
}

export default function FlightListingFullLoader() {
    return (
        <div className={styles.wrapper} aria-busy="true" aria-label="Searching flights">
            <div className="container mb-5 flight-listing-results">
                <div className="row">
                    <div className="col-md-3 d-none d-md-block">
                        <div className="hotel-filter-sidebar">
                            <div className="hotel-filter-panel-header">
                                <span className={styles.panelHeaderSkel} />
                            </div>
                            <FilterSectionSkeleton delay={0} />
                            <FilterSectionSkeleton delay={70} />
                            <FilterSectionSkeleton delay={140} />
                            <FilterSectionSkeleton delay={210} />
                        </div>
                    </div>

                    <div className="col-md-9 col-12">
                        <SearchStatusBar />

                        <div className={styles.cardsStack}>
                            <FlightCardSkeleton delay={120} />
                            <FlightCardSkeleton delay={260} />
                            <FlightCardSkeleton delay={400} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}