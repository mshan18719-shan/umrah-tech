'use client'
import React from 'react'
import Image from 'next/image';
import styles from './herosection.module.css';

export default function HeroSection() {
    return (
        <div className={styles.heroStaticWrapper}>
            <Image
                src="/images/hero/hero2.jpg"
                alt="Kaaba, Makkah at night"
                fill
                priority
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                quality={70}
            />
            <div className={styles.heroImageTint}></div>
        </div>
    )
}