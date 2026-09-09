'use client';

import React from 'react';
import moment from 'moment';
import { MdOutlineRoute, MdCalendarMonth, MdPeople } from 'react-icons/md';
import { FaLocationDot } from 'react-icons/fa6';
import styles from './TransferInfo.module.css';

const formatTripType = (type) => {
    const labels = {
        'one-way': 'One Way',
        return: 'Return',
        'all-round': 'All Round',
    };
    return labels[type] || type;
};

export default function TransferInfo({ searchInfo }) {
    const pickupDate = searchInfo?.pickupDate
        ? moment(searchInfo.pickupDate).format('DD MMM YYYY')
        : null;
    const pickupTime = searchInfo?.pickupTime
        ? moment(searchInfo.pickupTime, 'HH:mm:ss').format('hh:mm A')
        : null;
    const returnDate = searchInfo?.dropoffDate
        ? moment(searchInfo.dropoffDate).format('DD MMM YYYY')
        : null;
    const returnTime = searchInfo?.dropoffTime
        ? moment(searchInfo.dropoffTime, 'HH:mm:ss').format('hh:mm A')
        : null;

    const isAllRound = searchInfo?.transferType === 'all-round';
    const passengerCount = searchInfo?.passengers || 0;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.headerIcon}>
                    <MdOutlineRoute size={18} />
                </div>
                <h6 className={styles.title}>Your Transfer Info</h6>
            </div>

            <div className={styles.body}>
                <div className={styles.routeSection}>
                    <div className={styles.routePoint}>
                        <div className={`${styles.routeDot} ${styles.routeDotPickup}`}>
                            <FaLocationDot />
                        </div>
                        <div className={styles.routeContent}>
                            <span className={styles.routeLabel}>Pick up</span>
                            <p className={styles.routeLocation}>
                                {searchInfo?.pickupLocation || '—'}
                            </p>
                        </div>
                    </div>

                    {!isAllRound && (
                        <div className={styles.routePoint}>
                            <div className={`${styles.routeDot} ${styles.routeDotDropoff}`}>
                                <FaLocationDot />
                            </div>
                            <div className={styles.routeContent}>
                                <span className={styles.routeLabel}>Drop off</span>
                                <p className={styles.routeLocation}>
                                    {searchInfo?.dropoffLocation || '—'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.detailsGrid}>
                    {(pickupDate || pickupTime) && (
                        <div className={styles.detailRow}>
                            <div className={styles.detailIcon}>
                                <MdCalendarMonth />
                            </div>
                            <div className={styles.detailText}>
                                <span className={styles.detailLabel}>Pick up</span>
                                <p className={styles.detailValue}>
                                    {[pickupDate, pickupTime].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                        </div>
                    )}

                    {searchInfo?.transferType === 'return' && (returnDate || returnTime) && (
                        <div className={styles.detailRow}>
                            <div className={styles.detailIcon}>
                                <MdCalendarMonth />
                            </div>
                            <div className={styles.detailText}>
                                <span className={styles.detailLabel}>Return</span>
                                <p className={styles.detailValue}>
                                    {[returnDate, returnTime].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.footer}>
                <span className={styles.passengerInfo}>
                    <MdPeople />
                    {passengerCount} Passenger{Number(passengerCount) !== 1 ? 's' : ''}
                </span>
                {searchInfo?.transferType && (
                    <span className={styles.tripBadge}>
                        {formatTripType(searchInfo.transferType)}
                    </span>
                )}
            </div>
        </div>
    );
}
