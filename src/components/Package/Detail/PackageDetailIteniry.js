'use client';

import React from 'react';
import { MdMenuBook } from 'react-icons/md';
import styles from '@/app/(packages)/[slug]/[packageSlug]/PackageDetail.module.css';

export default function PackageDetailIteniry({ itinrList = [] }) {
    if (!itinrList.length) return null;

    return (
        <div className={`${styles.itinerarySection} my-4`}>
            <div className={styles.itineraryHeader}>
                <span className={styles.itineraryHeaderIcon} aria-hidden="true">
                    <MdMenuBook size={18} />
                </span>
                <h5 className={styles.itineraryTitle}>Day by Day Itinerary</h5>
            </div>

            <div className={styles.itineraryList}>
                {itinrList.map((itenr, index) => {
                    const heading = [itenr?.title, itenr?.description]
                        .filter(Boolean)
                        .join(' — ');

                    return (
                        <article key={index} className={styles.itineraryCard}>
                            <div className={styles.itineraryCardTop}>
                                <span className={styles.itineraryDay}>{index + 1}</span>
                                <h6 className={styles.itineraryCardTitle}>
                                    {heading || `Day ${index + 1}`}
                                </h6>
                            </div>
                            {itenr?.content && (
                                <div className={styles.itineraryCardBody}>
                                    <p className={styles.itineraryCardText}>{itenr.content}</p>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
