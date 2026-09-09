'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import moment from 'moment';
import { FaPlaneDeparture, FaStar, FaUser } from 'react-icons/fa';
import { IoLocationSharp } from 'react-icons/io5';
import { MdPhone } from 'react-icons/md';
import PriceDisplay from '../Currency/PriceDisplay';
import styles from './PackageCard.module.css';

function PackageCardItem({ item }) {
    const [imgFallback, setImgFallback] = useState(false);

    const validPrices = item?.price_Details?.filter((p) => p.type !== 'without_beds') || [];
    const minPrice = validPrices.reduce(
        (min, p) => (Number(p.sale_per_person) < min ? Number(p.sale_per_person) : min),
        Number(validPrices?.[0]?.sale_per_person) || 0
    );

    const nights = Math.max(
        moment(item.end_date).diff(moment(item.start_date), 'days'),
        0
    );
    const nightsLabel = `${nights} Night${nights === 1 ? '' : 's'}`;
    const starCount =
        item?.star_rating && !Number.isNaN(Number(item.star_rating))
            ? Math.round(Number(item.star_rating))
            : 0;

    const departure =
        item?.flights?.length > 0
            ? item.flights[0]?.stops?.[0]?.departure_from
            : null;

    const detailHref = `/${item.category?.slug}/${item.slug}`;
    const imageSrc =
        imgFallback || !item?.featured_image
            ? '/images/home/makkah.jpg'
            : item.featured_image;

    return (
        <article className={styles.card}>
            {/* Left — image */}
            <div className={styles.media}>
                <Link href={detailHref} className={styles.mediaLink} aria-label={item.title}>
                    <Image
                        src={imageSrc}
                        width={280}
                        height={220}
                        className={styles.image}
                        alt={item.title}
                        quality={85}
                        onError={() => setImgFallback(true)}
                        unoptimized
                    />
                </Link>
                <span className={styles.nightsBadge}>{nightsLabel}</span>
            </div>

            {/* Middle — details */}
            <div className={styles.body}>
                <div className={styles.meta}>
                    <div className={styles.rating}>
                        {starCount > 0 ? (
                            Array.from({ length: starCount }).map((_, i) => (
                                <FaStar key={i} className={styles.star} />
                            ))
                        ) : (
                            <span className={styles.ratingMuted}>No Rating</span>
                        )}
                    </div>
                    <time className={styles.dates}>
                        {moment(item.start_date).format('DD MMM YYYY')}
                        <span aria-hidden="true">-</span>
                        {moment(item.end_date).format('DD MMM YYYY')}
                    </time>
                </div>

                <Link href={detailHref} className={styles.titleLink}>
                    <h3 className={styles.title}>{item.title}</h3>
                </Link>

                <p className={styles.description}>
                    <IoLocationSharp className={styles.pin} aria-hidden="true" />
                    <span>
                        {item.description_text ||
                            'Package details available on booking'}
                    </span>
                </p>

                <div className={styles.chips}>
                    {item?.pax != null && (
                        <span className={styles.chip}>
                            <FaUser size={12} aria-hidden="true" />
                            Pax {item.pax}
                        </span>
                    )}
                    {departure && (
                        <span className={styles.chip}>
                            <FaPlaneDeparture size={12} aria-hidden="true" />
                            {departure}
                        </span>
                    )}
                </div>

                <Link href="/" className={styles.callBtn}>
                    <MdPhone size={15} aria-hidden="true" />
                    Call Now
                </Link>
            </div>

            {/* Right — price + book */}
            <div className={styles.aside}>
                <div className={styles.pricing}>
                    {/* <p className={styles.priceUnit}>
                        <PriceDisplay
                            price={Number(minPrice)}
                            currency={item?.currency_code}
                        />
                       
                    </p> */}
                    <div className={styles.priceMain}>
                        <PriceDisplay
                            price={Number(minPrice)}
                            currency={item?.currency_code}
                        />
                         <span className={styles.priceUnit}> / person</span>
                    </div>
                    <p className={styles.priceNote}>VAT &amp; taxes included</p>
                    {/* <p className={styles.priceTotal}>
                        Starting price · {nightsLabel.toLowerCase()}
                    </p> */}
                </div>

                <Link href={detailHref} className={styles.bookBtn}>
                    Book Now
                </Link>
            </div>
        </article>
    );
}

export default function PackageCard({ packageList = [] }) {
    return (
        <div className={styles.list} id="top_packages">
            {packageList.map((item, index) => (
                <PackageCardItem
                    key={item.id || item.slug || index}
                    item={item}
                />
            ))}
        </div>
    );
}
