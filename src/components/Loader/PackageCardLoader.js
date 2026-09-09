import React from 'react';
import styles from '../Package/PackageCard.module.css';

function PackageCardSkeleton() {
    return (
        <article className={styles.card} aria-hidden="true">
            <div className={styles.media}>
                <span className={`${styles.skel} ${styles.skelMedia}`} />
                <span className={`${styles.skel} ${styles.skelBadge}`} />
            </div>

            <div className={styles.body}>
                <div className={styles.meta}>
                    <span className={`${styles.skel} ${styles.skelStars}`} />
                    <span className={`${styles.skel} ${styles.skelDates}`} />
                </div>

                <span className={`${styles.skel} ${styles.skelTitle}`} />
                <span className={`${styles.skel} ${styles.skelDesc}`} />
                <span className={`${styles.skel} ${styles.skelDescShort}`} />

                <div className={styles.chips}>
                    <span className={`${styles.skel} ${styles.skelChip}`} />
                    <span className={`${styles.skel} ${styles.skelChip}`} />
                </div>

                <span className={`${styles.skel} ${styles.skelCall}`} />
            </div>

            <div className={styles.aside}>
                <div className={styles.pricing}>
                    <span className={`${styles.skel} ${styles.skelPrice}`} />
                    <span className={`${styles.skel} ${styles.skelPriceNote}`} />
                </div>
                <span className={`${styles.skel} ${styles.skelBook}`} />
            </div>
        </article>
    );
}

export default function PackageCardLoader() {
    return (
        <div className={styles.list} id="top_packages">
            <PackageCardSkeleton />
            <PackageCardSkeleton />
            <PackageCardSkeleton />
        </div>
    );
}
