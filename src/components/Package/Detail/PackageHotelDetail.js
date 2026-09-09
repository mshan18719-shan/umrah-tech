'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FaStar, FaStarHalf, FaImages, FaLongArrowAltRight } from 'react-icons/fa';
import { FaLocationDot, FaHotel as FaHotelIcon } from 'react-icons/fa6';
import { MdHotel, MdOutlineDirectionsWalk } from 'react-icons/md';
import moment from 'moment';
import styles from './PackageHotelDetail.module.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

function getAmenities(hotel) {
    const raw =
        hotel?.amenities ||
        hotel?.facilities ||
        hotel?.facility_list ||
        [];
    if (Array.isArray(raw)) {
        return raw
            .map((a) => (typeof a === 'string' ? a : a?.name || a?.title))
            .filter(Boolean);
    }
    return [];
}

export default function PackageHotelDetail({ PackageDetail }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentHotelIndex, setCurrentHotelIndex] = useState(null);

    const hotels = PackageDetail?.hotels || [];
    if (!hotels.length) return null;

    const openLightbox = (index) => {
        setCurrentHotelIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        setCurrentHotelIndex(null);
    };

    return (
        <div className={styles.hotelSection}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} aria-hidden="true">
                    <MdHotel size={18} />
                </span>
                <h5 className={styles.sectionHeading}>Accommodation</h5>
            </div>

            <div className={styles.hotelList}>
                {hotels.map((item, index) => {
                    const hotel = item?.hotel || {};
                    const rating = Number(hotel?.rating);
                    const fullStars = Math.floor(rating);
                    const hasHalfStar = rating % 1 >= 0.5;
                    const nights = moment(hotel?.booked_to).diff(
                        moment(hotel?.booked_from),
                        'days'
                    );
                    const hasImage = !!hotel?.featured_image;
                    const amenities = getAmenities(hotel);
                    const visibleAmenities = amenities.slice(0, 3);
                    const moreAmenities = Math.max(amenities.length - 3, 0);
                    const distance =
                        hotel?.distance_from_haram ||
                        hotel?.distance ||
                        hotel?.haram_distance ||
                        null;

                    const hasGallery = !!hotel?.gallery_images?.length;

                    return (
                        <article key={index} className={styles.hotelCard}>
                            <div className={styles.hotelCardInner}>
                                <div className={styles.media}>
                                    {hasImage ? (
                                        <Image
                                            fill
                                            sizes="(max-width: 768px) 100vw, 220px"
                                            className={styles.hotelImage}
                                            src={hotel.featured_image}
                                            alt={hotel?.name || 'Hotel image'}
                                        />
                                    ) : (
                                        <div className={styles.mediaPlaceholder}>
                                            <FaHotelIcon />
                                        </div>
                                    )}

                                    {hasGallery && (
                                        <button
                                            type="button"
                                            className={styles.viewPhotosBtn}
                                            onClick={() => openLightbox(index)}
                                            aria-label={`View photos of ${hotel?.name || 'hotel'}`}
                                        >
                                            <FaImages size={12} aria-hidden="true" />
                                            View photos
                                        </button>
                                    )}
                                </div>

                                <div className={styles.content}>
                                    <div className={styles.starsRow}>
                                        <span className={styles.starsRow}>
                                            {rating > 0 ? (
                                                <>
                                                    {Array(fullStars)
                                                        .fill(0)
                                                        .map((_, i) => (
                                                            <FaStar
                                                                key={`full-${i}`}
                                                                className={styles.star}
                                                                size={13}
                                                            />
                                                        ))}
                                                    {hasHalfStar && (
                                                        <FaStarHalf
                                                            className={styles.star}
                                                            size={13}
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <span className={styles.noRating}>
                                                    No Rating
                                                </span>
                                            )}
                                        </span>
                                        <span className={styles.bookingDate}>
                                            ({(hotel?.booked_from) ? moment(hotel?.booked_from).format('DD-MM-YYYY') : ''} <FaLongArrowAltRight /> {(hotel?.booked_to) ? moment(hotel?.booked_to).format('DD-MM-YYYY') : ''})
                                        </span>
                                    </div>

                                    <h6 className={styles.hotelName}>
                                        {hotel?.name}
                                    </h6>

                                    {hotel?.address && (
                                        <p className={styles.addressRow}>
                                            <FaLocationDot
                                                size={13}
                                                className={styles.addressIcon}
                                                aria-hidden="true"
                                            />
                                            <span>{hotel.address}</span>
                                        </p>
                                    )}

                                    {(visibleAmenities.length > 0 ||
                                        item?.rooms?.length > 0) && (
                                            <div className={styles.amenityRow}>
                                                {visibleAmenities.length > 0
                                                    ? visibleAmenities.map((a, i) => (
                                                        <span
                                                            key={i}
                                                            className={styles.amenityChip}
                                                        >
                                                            {a}
                                                        </span>
                                                    ))
                                                    : item.rooms
                                                        .slice(0, 3)
                                                        .map((room, rindex) => (
                                                            <span
                                                                key={rindex}
                                                                className={styles.amenityChip}
                                                            >
                                                                {room?.type}
                                                                {room?.items?.data?.meal
                                                                    ? ` · ${room.items.data.meal}`
                                                                    : ''}
                                                            </span>
                                                        ))}
                                                {moreAmenities > 0 && (
                                                    <span className={styles.amenityMore}>
                                                        +{moreAmenities} more
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                    <div className={styles.cardFooter}>
                                        {distance ? (
                                            <span className={styles.distance}>
                                                <MdOutlineDirectionsWalk
                                                    size={14}
                                                    aria-hidden="true"
                                                />
                                                {distance}
                                            </span>
                                        ) : hotel?.city ? (
                                            <span className={styles.distance}>
                                                <FaLocationDot size={12} aria-hidden="true" />
                                                {hotel.city}
                                            </span>
                                        ) : (
                                            <span />
                                        )}
                                        {Number.isFinite(nights) && nights >= 0 && (
                                            <span className={styles.nightsBadge}>
                                                {nights}{' '}
                                                {nights === 1 ? 'night' : 'nights'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {lightboxOpen &&
                currentHotelIndex !== null &&
                PackageDetail?.hotels[currentHotelIndex]?.hotel?.gallery_images && (
                    <Lightbox
                        open={lightboxOpen}
                        close={closeLightbox}
                        slides={PackageDetail.hotels[
                            currentHotelIndex
                        ].hotel.gallery_images.map((img) => ({
                            src: img,
                            alt:
                                PackageDetail.hotels[currentHotelIndex]?.hotel
                                    ?.name || 'Hotel image',
                        }))}
                        carousel={{
                            finite:
                                PackageDetail.hotels[currentHotelIndex].hotel
                                    .gallery_images.length <= 1,
                        }}
                        render={{
                            buttonPrev:
                                PackageDetail.hotels[currentHotelIndex].hotel
                                    .gallery_images.length <= 1
                                    ? () => null
                                    : undefined,
                            buttonNext:
                                PackageDetail.hotels[currentHotelIndex].hotel
                                    .gallery_images.length <= 1
                                    ? () => null
                                    : undefined,
                        }}
                    />
                )}
        </div>
    );
}
