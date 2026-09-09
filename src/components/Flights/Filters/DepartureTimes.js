'use client'
import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation';
import { TbSunrise, TbSun, TbCloud, TbMoon } from 'react-icons/tb';
import { LiaAngleDownSolid } from 'react-icons/lia';
import { useFlightList } from '../FlightListingContext';
import { FLIGHT_TIME_SLOTS } from './flightTimeSlots';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import styles from './DepartureTimes.module.css';

const SLOT_ICONS = {
    0: TbSunrise,
    1: TbSun,
    2: TbCloud,
    3: TbMoon,
};

function TimeSlotGrid({ slots, selectedSlots, onToggle, currency }) {
    return (
        <div className={styles.grid}>
            {FLIGHT_TIME_SLOTS.map((slot) => {
                const slotData = slots[slot.id];
                const isSelected = selectedSlots.includes(slot.id);
                const isDisabled = !slotData?.count;
                const Icon = SLOT_ICONS[slot.id];

                return (
                    <button
                        key={slot.id}
                        type="button"
                        className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${isDisabled ? styles.cardDisabled : ''}`}
                        onClick={() => !isDisabled && onToggle(slot.id)}
                        disabled={isDisabled}
                        aria-pressed={isSelected}
                    >
                        <span className={styles.icon}><Icon /></span>
                        <span className={styles.timeLabel}>{slot.label}</span>
                        <span className={styles.price}>
                            {slotData?.minPrice != null && (
                                <PriceDisplay price={slotData.minPrice} currency={currency} />
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export default function DepartureTimes() {
    const [isOpen, setIsOpen] = useState(true);
    const searchParams = useSearchParams();
    const {
        selectedDepartureSlots,
        setSelectedDepartureSlots,
        selectedArrivalSlots,
        setSelectedArrivalSlots,
        flightTimeSlotData,
        flightTimeRoute,
        setCurrentPage,
    } = useFlightList();

    const toggleSlot = (setter, slotId) => {
        setter((prev) => (
            prev.includes(slotId)
                ? prev.filter((id) => id !== slotId)
                : [...prev, slotId]
        ));
        setCurrentPage(1);
    };

    const departureCode = flightTimeRoute?.departureCode || searchParams.get('DepartureCode') || '';
    const arrivalCode = flightTimeRoute?.arrivalCode || searchParams.get('ArrivalCode') || '';
    const departureCity = flightTimeRoute?.departureCity || departureCode;
    const arrivalCity = flightTimeRoute?.arrivalCity || arrivalCode;
    const currency = flightTimeSlotData?.currency || 'GBP';

    return (
        <div className={`${styles.flightTimes} hotel-filter-section`}>
            <div
                className={styles.header}
                onClick={() => setIsOpen((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen((prev) => !prev);
                    }
                }}
            >
                <p className={`${styles.title} hotel-filter-section__label`}>Flight Times</p>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                    <LiaAngleDownSolid />
                </span>
            </div>

            {isOpen && (
                <>
                    <p className={styles.route}>
                        {departureCity} &rarr; {arrivalCity}
                    </p>

                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>
                            Depart from {departureCity} ({departureCode})
                        </p>
                        <TimeSlotGrid
                            slots={flightTimeSlotData?.departure || {}}
                            selectedSlots={selectedDepartureSlots}
                            onToggle={(slotId) => toggleSlot(setSelectedDepartureSlots, slotId)}
                            currency={currency}
                        />
                    </div>

                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>
                            Arrive in {arrivalCity} ({arrivalCode})
                        </p>
                        <TimeSlotGrid
                            slots={flightTimeSlotData?.arrival || {}}
                            selectedSlots={selectedArrivalSlots}
                            onToggle={(slotId) => toggleSlot(setSelectedArrivalSlots, slotId)}
                            currency={currency}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
