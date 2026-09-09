'use client'
import React, { useState, useEffect } from 'react'
import { FaKaaba } from 'react-icons/fa6'
import styles from './Umrah_Getaway_Detail_Loader.module.css'

const LOADING_MESSAGES = [
    'Loading Makkah hotel details…',
    'Loading Madinah hotel details…',
    'Fetching flight options…',
    'Setting up additional services…',
    'Almost ready…',
]

const STEPS = [
    { wide: false },
    { wide: false },
    { wide: true },
    { wide: true },
]

export default function Umrah_Getaway_Detail_Loader() {
    const [messageIndex, setMessageIndex] = useState(0)
    const [fade, setFade] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false)
            setTimeout(() => {
                setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
                setFade(true)
            }, 200)
        }, 2400)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className={`container ${styles.wrapper}`}>
            <div className={styles.stepper}>
                <div className={styles.stepperRow}>
                    {STEPS.map((step, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <div className={styles.connector} />}
                            <div className={styles.step}>
                                <div className={styles.stepCircle} />
                                <div className={`${styles.stepLine} ${step.wide ? styles.stepLineWide : ''}`} />
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.loaderBanner}>
                    <div className={styles.spinnerWrap}>
                        <div className={styles.spinnerRing} />
                        <div className={styles.spinnerIcon}>
                            <FaKaaba />
                        </div>
                    </div>
                    <div className={styles.bannerText}>
                        <h2 className={styles.bannerTitle}>Loading Your Umrah Package</h2>
                        <p
                            className={styles.bannerMessage}
                            style={{ opacity: fade ? 1 : 0 }}
                        >
                            {LOADING_MESSAGES[messageIndex]}
                        </p>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressBar} />
                        </div>
                    </div>
                </div>

                <div className={styles.skeletonBody}>
                    <div className={styles.chipsRow}>
                        <div className={styles.chip} />
                        <div className={styles.chip} />
                        <div className={styles.chip} />
                    </div>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonGrid}>
                        <div className={styles.skeletonImage} />
                        <div className={styles.skeletonRooms}>
                            <div className={styles.skeletonRoom} />
                            <div className={styles.skeletonRoom} />
                            <div className={styles.skeletonRoom} />
                        </div>
                    </div>
                    <div className={styles.skeletonFooter}>
                        <div className={styles.skeletonBtn} />
                        <div className={`${styles.skeletonBtn} ${styles.skeletonBtnWide}`} />
                    </div>
                </div>
            </div>
        </div>
    )
}
