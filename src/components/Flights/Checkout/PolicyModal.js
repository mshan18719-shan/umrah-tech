'use client';

import React, { useState } from 'react';
import { Modal } from '@mantine/core';
import Image from 'next/image';
import { IoMdClose } from 'react-icons/io';
import airline from '@/util/airlines.json';
import {
    getLegBaggageRows,
    getLegPassengerPolicyRows,
    formatPolicyFeeLabel,
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

    const renderFeeCell = (penalty, kind) => {
        const label = formatPolicyFeeLabel(penalty, kind, currency, rates);
        if (label === 'Free') {
            return <span className={styles.freeText}>Free</span>;
        }
        if (label === 'Not refundable' || label === 'Not permitted') {
            return <span className={styles.deniedText}>{label}</span>;
        }
        return label;
    };

    const renderPolicyTable = (group, groupIndex, kind) => {
        const rows = getLegPassengerPolicyRows(
            flightDetails,
            group.segments,
            groupIndex,
            kind
        );

        const beforeLabel = kind === 'change' ? 'Change before departure' : 'Refund before departure';
        const afterLabel = kind === 'change' ? 'Change after departure' : 'Refund after departure';
        const title = kind === 'change' ? 'Reschedule charges' : 'Cancellation Policy';

        if (!rows.length) {
            return (
                <>
                    <h4 className={styles.sectionTitle}>{title}</h4>
                    <p className={styles.emptyPolicy}>Policy details are not available for this flight.</p>
                </>
            );
        }

        return (
            <>
                <h4 className={styles.sectionTitle}>{title}</h4>
                <div className={styles.tableWrap}>
                    <table className={styles.policyTable}>
                        <thead>
                            <tr>
                                <th>Passenger Type</th>
                                <th>{beforeLabel}</th>
                                <th>{afterLabel}</th>
                                <th>Service Fees</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={`${kind}-${groupIndex}-${row.key}`}>
                                    <td>{PASSENGER_TYPE_LABELS[row.passenger] || row.passenger}</td>
                                    <td>{renderFeeCell(row.before, kind)}</td>
                                    <td>{renderFeeCell(row.after, kind)}</td>
                                    <td>
                                        <span className={styles.freeText}>Free</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    const renderBaggageTable = (group, groupIndex) => {
        const rows = getLegBaggageRows(flightDetails, group.segments, groupIndex);

        if (!rows.length) {
            return <p className={styles.emptyPolicy}>Baggage details are not available for this flight.</p>;
        }

        return (
            <>
                <div className={styles.tableWrap}>
                    <table className={styles.policyTable}>
                        <thead>
                            <tr>
                                <th>Service Type</th>
                                <th>Passenger Type</th>
                                <th>Allowance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={`${groupIndex}-${row.key}`}>
                                    <td>{row.service}</td>
                                    <td>{PASSENGER_TYPE_LABELS[row.passenger] || row.passenger}</td>
                                    <td>{row.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className={styles.disclaimer}>
                    The baggage allowance may vary according to the fare selected. Please check
                    with the airline for the most accurate information.
                </p>
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
                                        <p className={styles.routeSub}>
                                            {firstSegment.departure.city} ({firstSegment.departure.airport_code}) -{' '}
                                            {lastSegment.arrival.city} ({lastSegment.arrival.airport_code})
                                        </p>
                                    </div>
                                </div>

                                {activeTab === 'baggage' && renderBaggageTable(group, groupIndex)}
                                {activeTab === 'reschedule' && renderPolicyTable(group, groupIndex, 'change')}
                                {activeTab === 'cancellation' && renderPolicyTable(group, groupIndex, 'refund')}
                            </div>
                        );
                    })}

                    {(activeTab === 'reschedule' || activeTab === 'cancellation') && renderFareRules()}
                </div>
            </div>
        </Modal>
    );
}
