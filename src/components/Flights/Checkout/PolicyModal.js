'use client';

import React, { useState } from 'react';
import { Modal } from '@mantine/core';
import Image from 'next/image';
import { IoMdClose } from 'react-icons/io';
import airline from '@/util/airlines.json';
import {
    getCancellationAirlineFee,
    getAirlineFeeLabel,
} from './flightHelpers';
import { useCurrency } from '@/util/currency';
import styles from './PolicyModal.module.css';

const TABS = [
    { id: 'baggage', label: 'Baggage Allowance' },
    { id: 'reschedule', label: 'Reschedule Charges' },
    { id: 'cancellation', label: 'Cancellation Policy' },
];

const PASSENGER_TYPE_LABELS = {
    adult: 'Adult',
    child: 'Child',
    infant: 'Infant',
};

export default function PolicyModal({ opened, onClose, flightDetails, segmentGroups = [] }) {
    const { currency, rates } = useCurrency();
    const [activeTab, setActiveTab] = useState('baggage');

    const penalties = flightDetails?.penalties;
    const renderBaggageRows = (segment) => {
        const baggageInfo = segment?.baggage_info;
        if (!baggageInfo) return null;

        return Object.entries(baggageInfo).map(([type, baggage]) => {
            if (!baggage?.cabin && !baggage?.checked) return null;

            return (
                <React.Fragment key={`${segment.flight_number}-${type}`}>
                    {baggage.cabin && (
                        <tr>
                            <td>Cabin Baggage</td>
                            <td>{PASSENGER_TYPE_LABELS[type] || type}</td>
                            <td>{baggage.cabin}</td>
                        </tr>
                    )}
                    {baggage.checked && (
                        <tr>
                            <td>Checked Baggage</td>
                            <td>{PASSENGER_TYPE_LABELS[type] || type}</td>
                            <td>{baggage.checked}</td>
                        </tr>
                    )}
                </React.Fragment>
            );
        });
    };

    const renderPolicyTable = (type) => {
        const penalty =
            type === 'reschedule'
                ? penalties?.change_before_departure
                : penalties?.refund_before_departure;

        const airlineFee =
            type === 'reschedule'
                ? getAirlineFeeLabel(penalty, currency, rates)
                : getCancellationAirlineFee(penalty, currency, rates);

        return (
            <>
                <h4 className={styles.sectionTitle}>
                    {type === 'reschedule' ? 'Reschedule charges' : 'Cancellation Policy'}
                </h4>
                <div className={styles.tableWrap}>
                    <table className={styles.policyTable}>
                        <thead>
                            <tr>
                                <th>Passenger Type</th>
                                <th>Airline Fees (Per Passenger)</th>
                                <th>Service Fees (Per Passenger)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Adult</td>
                                <td>{airlineFee}</td>
                                <td>
                                        <span className={styles.freeText}>Free</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    const renderFareRules = () => (
        <div className={styles.fareRules}>
            <p>
                <strong>Fare Rules :</strong> Please note that the fare selected is governed by its own set of rules
                &amp; restrictions. For the purpose of your booking, the most restrictive set of rule will apply.
            </p>
            
        </div>
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            withCloseButton={false}
            padding={0}
            size="auto"
            centered
            overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
            classNames={{
                content: styles.modalContent,
                body: styles.modalBody,
            }}
        >
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Baggage &amp; Cancellation Policy</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Close">
                        <IoMdClose size={22} />
                    </button>
                </div>

                <div className={styles.tabs} role="tablist">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className={styles.content}>
                    {segmentGroups.map((group, groupIndex) => {
                        const firstSegment = group.segments[0];
                        const lastSegment = group.segments[group.segments.length - 1];
                        const segmentAirlineData = airline.find((a) => a.iata === firstSegment.airline?.code);
                        const airlineLogo = firstSegment.airline?.logo_url || segmentAirlineData?.logo;
                        const airlineName = firstSegment.airline?.name || segmentAirlineData?.name || firstSegment.airline?.code;

                        return (
                            <div key={groupIndex} className={styles.flightBlock}>
                                <div className={styles.flightHeader}>
                                    {airlineLogo && (
                                        <Image
                                            src={airlineLogo}
                                            alt={airlineName}
                                            width={28}
                                            height={28}
                                            className={styles.airlineLogo}
                                        />
                                    )}
                                    <div>
                                        <span className={styles.flightLabel}>{group.label}</span>
                                        {/* <h3 className={styles.routeTitle}>
                                            {firstSegment.departure.city} - {lastSegment.arrival.city}
                                        </h3> */}
                                        <p className={styles.routeSub}>
                                            {firstSegment.departure.city} ({firstSegment.departure.airport_code}) -{' '}
                                            {lastSegment.arrival.city} ({lastSegment.arrival.airport_code})
                                        </p>
                                    </div>
                                </div>

                                {activeTab === 'baggage' && (
                                    <>
                                        <div className={styles.tableWrap}>
                                            <table className={styles.policyTable}>
                                                <tbody>
                                                    {group.segments.map((segment, idx) =>
                                                        renderBaggageRows(segment, idx)
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className={styles.disclaimer}>
                                            The baggage allowance may vary according to the fare selected. Please check
                                            with the airline for the most accurate information.
                                        </p>
                                    </>
                                )}

                                {activeTab === 'reschedule' && renderPolicyTable('reschedule')}
                                {activeTab === 'cancellation' && renderPolicyTable('cancellation')}
                            </div>
                        );
                    })}

                    {(activeTab === 'reschedule' || activeTab === 'cancellation') && renderFareRules()}
                </div>
            </div>
        </Modal>
    );
}
