'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import { FaGlobe } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import styles from './Destinations.module.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
});

// Static fallback data — replace with an API fetch once the endpoint is live.
const destinations = [
  {
    id: 1,
    name: "Makkah",
    country: "Saudi Arabia",
    image: "/images/destinations/des1.jpg",
    search: {
      place: "Makkah",
      city: "Makkah",
      nationality: "PK",
      lat: "21.4240968",
      lng: "39.81733639999999",
      code: "SA",
      location: "Makkah",
      country: "Saudi Arabia",
    },
  },
  {
    id: 2,
    name: "Madinah",
    country: "Saudi Arabia",
    image: "/images/destinations/des2.jpg",
    search: {
      place: "Madinah",
      city: "Madinah",
      nationality: "PK",
      lat: "24.4672132",
      lng: "39.6024496",
      code: "SA",
      location: "Madinah",
      country: "Saudi Arabia",
    },
  },

  {
    id: 3,
    name: 'Istanbul',
    country: 'Turkey',
    image: '/images/destinations/des3.jpg',
    search: {
      place: "Istanbul",
      city: "Istanbul",
      nationality: "PK",
      lat: "41.0082376",
      lng: "28.9783589",
      code: "TR",
      location: "Istanbul",
      country: "Turkey",
    },
  },
  {
    id: 4,
    name: 'Dubai',
    country: 'UAE',
    image: '/images/destinations/des4.jpg',
    search: {
      place: "Dubai",
      city: "Dubai",
      nationality: "PK",
      lat: "25.2048493",
      lng: "55.2707828",
      code: "AE",
      location: "Dubai",
      country: "UAE",
    },
  },
  {
    id: 5,
    name: 'Cairo',
    country: 'Egypt',
    image: '/images/destinations/des5.jpg',
    search: {
      place: "Cairo",
      city: "Cairo",
      nationality: "PK",
      lat: "30.0444196",
      lng: "31.2357116",
      code: "EG",
      location: "Cairo",
      country: "Egypt",
    },
  },
];

const getDates = () => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);

  const format = (date) => date.toISOString().split("T")[0];

  return {
    checkIn: format(checkIn),
    checkOut: format(checkOut),
  };
};

const makeSlug = (name) =>
  name?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') || '';

export default function Destinations() {
  if (!destinations.length) return null;

  return (
    <section className={styles.section} aria-label="Popular Destinations">
      <div className="container">
        <header className={styles.header}>
          <span className={styles.tag}>
            <FaGlobe className={styles.tagIcon} aria-hidden="true" />
            Destinations
          </span>
          <h2 className={`${styles.title} ${playfair.className}`}>
            Popular Destinations
          </h2>
          <p className={styles.subtitle}>
            From the Holy Cities to iconic Muslim heritage destinations
            around the world
          </p>
        </header>

        <div className={styles.sliderWrap}>
          <Swiper
            className={styles.destinationSwiper}
            spaceBetween={16}
            slidesPerView={1}
            slidesPerGroup={1}
            watchOverflow
            allowTouchMove
            autoHeight
            breakpoints={{
              320: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 16 },
              768: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 16 },
              992: { slidesPerView: 5, slidesPerGroup: 1, spaceBetween: 16 },
            }}
          >
            {destinations.slice(0, 10).map((destination, index) => {
              const { checkIn, checkOut } = getDates();

              const href = {
                pathname: "/hotels",
                query: {
                  checkIn,
                  checkOut,
                  currency: "GBP",
                  ...destination.search,
                },
              };

              return (
                <SwiperSlide key={destination.id ?? index}>
                  <Link
                    href={href}
                    className={styles.cardLink}
                  >
                    <article className={styles.card}>
                      <Image
                        fill
                        src={destination.image}
                        alt={destination.name}
                        className={styles.cardImage}
                        sizes="(max-width: 767px) 90vw, (max-width: 991px) 30vw, 20vw"
                      />

                      <div className={styles.overlay} aria-hidden="true" />

                      <div className={styles.cardBody}>
                        <h3 className={styles.destName}>{destination.name}</h3>
                        {destination.country && (
                          <p className={styles.country}>{destination.country}</p>
                        )}
                        {typeof destination.packageCount === 'number' && (
                          <p className={styles.packages}>
                            {destination.packageCount} package
                            {destination.packageCount === 1 ? '' : 's'}
                          </p>
                        )}
                      </div>
                    </article>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}