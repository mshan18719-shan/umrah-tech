'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Modal } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { FaClock } from 'react-icons/fa6'
import { useFlightStore } from '@/components/Store/FlightStore'
import styles from './FlightCheckoutTimer.module.css'

const CHECKOUT_TTL_MS = 30 * 60 * 1000
// TEMP: disable checkout expiry so testing flights are not cleared
const TIMER_DISABLED = true

function formatRemainingTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function FlightCheckoutTimer({ flightId, onExpire }) {
    const router = useRouter()
    const clearFlightData = useFlightStore((s) => s.clearFlightData)
    const [expiresAt, setExpiresAt] = useState(null)
    const [remainingSeconds, setRemainingSeconds] = useState(null)
    const expireCalledRef = useRef(false)

    useEffect(() => {
        if (TIMER_DISABLED) return
        if (!flightId) return

        const storageKey = `flight_checkout_expires_at_${flightId}`
        let endTime = null

        try {
            const stored = sessionStorage.getItem(storageKey)
            const parsed = stored ? Number(stored) : NaN
            // Keep stored end time even if already past — do NOT restart on refresh
            if (Number.isFinite(parsed)) {
                endTime = parsed
            }
        } catch (_) {
            /* ignore */
        }

        if (!endTime) {
            endTime = Date.now() + CHECKOUT_TTL_MS
            try {
                sessionStorage.setItem(storageKey, String(endTime))
            } catch (_) {
                /* ignore */
            }
        }

        setExpiresAt(endTime)
        expireCalledRef.current = false
    }, [flightId])

    useEffect(() => {
        if (TIMER_DISABLED) return
        if (!expiresAt) return

        const getRemaining = () => Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))

        const triggerExpire = () => {
            if (expireCalledRef.current) return
            expireCalledRef.current = true
            onExpire?.()
        }

        const initial = getRemaining()
        setRemainingSeconds(initial)
        if (initial === 0) {
            triggerExpire()
            return
        }

        const intervalId = setInterval(() => {
            const remaining = getRemaining()
            setRemainingSeconds(remaining)
            if (remaining === 0) {
                clearInterval(intervalId)
                triggerExpire()
            }
        }, 1000)

        return () => clearInterval(intervalId)
    }, [expiresAt, onExpire])

    // TEMP: hide timer UI and never expire checkout while testing
    if (TIMER_DISABLED) return null

    if (remainingSeconds === null) return null

    const isExpired = remainingSeconds === 0
    const isUrgent = !isExpired && remainingSeconds <= 5 * 60

    const handleGoToHome = () => {
        try {
            if (flightId) {
                sessionStorage.removeItem(`flight_checkout_expires_at_${flightId}`)
            }
        } catch (_) {
            /* ignore */
        }
        clearFlightData()
        router.push('/')
    }

    return (
        <>
            <div
                className={`${styles.timerPill}${isExpired ? ` ${styles.timerPillExpired}` : ''}${isUrgent ? ` ${styles.timerPillUrgent}` : ''}`}
                role="status"
                aria-live="polite"
            >
                <span className={styles.timerIcon} aria-hidden>
                    <FaClock />
                </span>

                {isExpired ? (
                    <div className={styles.expiredRow}>
                        <span className={styles.timerLabel}>Flight offer expired</span>
                        <button type="button" className={styles.searchBtn} onClick={handleGoToHome}>
                            Go to Home
                        </button>
                    </div>
                ) : (
                    <p className={styles.timerText}>
                        <span className={styles.timerLabel}>Time remaining:</span>{' '}
                        <span className={styles.timerValue}>{formatRemainingTime(remainingSeconds)}</span>
                    </p>
                )}
            </div>

            <Modal
                opened={isExpired}
                onClose={() => {}}
                withCloseButton={false}
                closeOnClickOutside={false}
                closeOnEscape={false}
                centered
                size="md"
                overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
                title={
                    <div className={styles.modalTitle}>
                        <FaClock aria-hidden />
                        <span>Session expired</span>
                    </div>
                }
            >
                <div className={styles.modalBody}>
                    <p>
                        Your checkout time has ended. This flight is no longer held and prices may have
                        changed.
                    </p>
                    <p>Please go to the home page and search again to continue with a new booking.</p>
                    <button type="button" className={styles.searchBtn} onClick={handleGoToHome}>
                        Go to Home
                    </button>
                </div>
            </Modal>
        </>
    )
}
