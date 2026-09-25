'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';
import Image from 'next/image';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import {
  FaArrowLeft,
  FaArrowRight,
  FaClock,
  FaMapMarkerAlt,
  FaHiking,
  FaStar,
} from 'react-icons/fa';
import { GoPerson } from 'react-icons/go';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css/pagination';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import styles from './TopActivities.module.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
});

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';

const renderStars = (rating) => {
  const count = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  return Array.from({ length: count }, (_, i) => (
    <FaStar key={i} className={styles.star} aria-hidden="true" />
  ));
};

function ActivityCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
      <div className={styles.imageSection}>
        <div className={`${styles.imageWrap} ${styles.skeletonImage}`} />
        <div className={styles.iconCorner}>
          <span className={`${styles.activityIcon} ${styles.skeletonIcon}`} />
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonLocation}`} />
        <div className={styles.metaRow}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.priceBlock}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonPrice}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonTax}`} />
          </div>
          <div className={`${styles.skeletonBlock} ${styles.skeletonBtn}`} />
        </div>
      </div>
    </article>
  );
}

export default function TopActivities() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/activities/search?date=${moment().add(1, 'days').format('YYYY-MM-DD')}`,
          {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!res.ok) return;

        const response = await res.json();

        if (response.Success && Array.isArray(response?.Content?.activities)) {
          setActivities(response.Content.activities);
        }
      } catch (error) {
        console.error('Activities fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (!isLoading && !activities.length) return null;

  const activityDate = moment().add(1, 'days').format('YYYY-MM-DD');

  return (
    <section className={styles.section} aria-label="Top Activities">
      <div className="container">
        <header className={styles.header}>
          <span className={styles.tag}>Activities</span>
          <h2 className={`${styles.title} ${playfair.className}`}>
           Experiences Worth Discovering
          </h2>
          <p className={styles.subtitle}>
           Explore activities and attractions designed to make every trip memorable.
          </p>
        </header>

        {isLoading ? (
          <div className={styles.skeletonGrid} aria-busy="true" aria-label="Loading activities">
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
          </div>
        ) : (
          <div className={styles.sliderWrap}>
            <div className={styles.controls}>
              <button
                type="button"
                className={`${styles.navBtn} topActivities-prev`}
                aria-label="Previous activities"
              >
                <FaArrowLeft />
              </button>
              <button
                type="button"
                className={`${styles.navBtn} topActivities-next`}
                aria-label="Next activities"
              >
                <FaArrowRight />
              </button>
            </div>

            <Swiper
              modules={[Pagination, Navigation]}
              spaceBetween={16}
              slidesPerView={1}
              slidesPerGroup={1}
              watchOverflow
              pagination={{ clickable: true, dynamicBullets: true }}
              navigation={{
                nextEl: '.topActivities-next',
                prevEl: '.topActivities-prev',
              }}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                  slidesPerGroup: 1,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 2,
                  slidesPerGroup: 2,
                  spaceBetween: 20,
                },
                992: {
                  slidesPerView: 3,
                  slidesPerGroup: 3,
                  spaceBetween: 24,
                },
              }}
              className={styles.activitySwiper}
            >
              {activities.slice(0, 8).map((activity) => (
                <SwiperSlide key={activity.id}>
                  <article className={styles.card}>
                    <div className={styles.imageSection}>
                      <div className={styles.imageWrap}>
                        <Image
                          src={
                            activity.featured_image ||
                            activity.banner_image ||
                            PLACEHOLDER_IMAGE
                          }
                          alt={activity.title}
                          fill
                          className={styles.cardImage}
                          sizes="(max-width: 576px) 90vw, (max-width: 992px) 50vw, 33vw"
                        />
                        {activity.rating_stars && (
                          <div className={styles.ratingBadge}>
                            {renderStars(activity.rating_stars)}
                          </div>
                        )}
                      </div>
                      <div className={styles.iconCorner} aria-hidden="true">
                        <span className={styles.activityIcon}>
                          <FaHiking />
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.activityTitle}>{activity.title}</h3>

                      {(activity.city || activity.address) && (
                        <div className={styles.location}>
                          <FaMapMarkerAlt
                            className={styles.locationIcon}
                            aria-hidden="true"
                          />
                          <span>
                            {[activity.city, activity.country]
                              .filter(Boolean)
                              .join(', ') || activity.address}
                          </span>
                        </div>
                      )}

                      <div className={styles.metaRow}>
                        {activity.max_people > 0 && (
                          <span className={styles.metaItem}>
                            <GoPerson
                              className={styles.metaIcon}
                              aria-hidden="true"
                            />
                            Max {activity.max_people}
                          </span>
                        )}
                        {activity.activity_duration && (
                          <span className={styles.metaItem}>
                            <FaClock
                              className={styles.metaIcon}
                              aria-hidden="true"
                            />
                            {activity.activity_duration}
                          </span>
                        )}
                      </div>


                      <div className={styles.cardFooter}>
                        <div className={styles.priceBlock}>
                          <div className={styles.priceRow}>
                            <span className={styles.priceValue}>
                              <PriceDisplay
                                price={activity.sale_price}
                                currency={activity.currency_code}
                              />
                            </span>
                            <span className={styles.priceUnit}>/person</span>
                          </div>
                          <span className={styles.taxNote}>
                            Vat and Taxes included
                          </span>
                        </div>

                        {activity.provider !== 'hotelbeds' ? (
                          <Link
                            href={`/activities/${activity.slug}?from=${activityDate}&to=${activityDate}&language=en`}
                            className={styles.viewBtn}
                          >
                            View Details
                            <FaArrowRight
                              className={styles.viewBtnIcon}
                              aria-hidden="true"
                            />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className={styles.viewBtn}
                          >
                            Coming Soon
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
}
