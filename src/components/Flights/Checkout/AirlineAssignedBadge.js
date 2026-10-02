'use client'

import { Tooltip } from '@mantine/core'
import { FaExclamation } from 'react-icons/fa'
import styles from '@/app/flights/checkout/checkout.module.css'

const AIRLINE_ASSIGNED_MESSAGE =
    'The airline will randomly assign a seat. Travel buddies may not be able to sit together.'

export default function AirlineAssignedBadge() {
    return (
        <Tooltip
            label={AIRLINE_ASSIGNED_MESSAGE}
            withArrow
            multiline
            w={280}
            position="top"
            events={{ hover: true, focus: true, touch: true }}
        >
            <span className={styles.seatAirlineBadge} tabIndex={0}>
                <span className={styles.seatAirlineIcon}>
                    <FaExclamation />
                </span>
                Assigned by airline
            </span>
        </Tooltip>
    )
}