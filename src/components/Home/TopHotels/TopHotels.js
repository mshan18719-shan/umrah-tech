'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';
import Image from 'next/image';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import { FaArrowLeft, FaArrowRight, FaMapMarkerAlt, FaStar, FaHotel } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css/pagination';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import styles from './TopHotels.module.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
});

const encodeProvider = (str) =>
  [...str].map((c) => (c.charCodeAt(0) + 3).toString(36)).join('');

const providerShortName = (encodedProvider) => {
  if (!encodedProvider) return '';
  return encodeProvider(encodedProvider).toLowerCase();
};

const makeSlug = (name) =>
  name?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') || '';

const renderStars = (rating) => {
  const count = Math.min(5, Math.max(0, Math.floor(Number(rating) || 4)));
  return Array.from({ length: count }, (_, i) => (
    <FaStar key={i} className={styles.star} aria-hidden="true" />
  ));
};

export default function TopHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchData, setSearchData] = useState({});

  useEffect(() => {
    const getTopHotelsWithDetails = async () => {
      try {
        const request = {
          provider: 'custom',
          checkIn: moment().add(1, 'days').format('YYYY-MM-DD'),
          checkOut: moment().add(2, 'days').format('YYYY-MM-DD'),
          rooms: [{ adults: 2, children: [] }],
        };

        setSearchData({
          check_in: request.checkIn,
          check_out: request.checkOut,
          provider: request.provider,
          rooms: request.rooms,
        });

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/hotel/search`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          }
        );

        if (!res.ok) return setLoading(false);

        const data = await res.json();
        const hotelsList = data.data?.hotels || [];

        if (!hotelsList.length) return setLoading(false);

        const { checkIn, checkOut } = request;

        const detailedHotels = await Promise.all(
          hotelsList.map(async (hotel) => {
            try {
              const detailRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/hotel/basic/details`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    provider: hotel.provider,
                    hotelId: hotel.id,
                    checkIn,
                    checkOut,
                  }),
                }
              );

              if (!detailRes.ok) {
                return { ...hotel, mainImage: hotel.image };
              }

              const detailData = await detailRes.json();
              return {
                ...hotel,
                mainImage:
                  detailData.data?.main_images?.[0]?.url || hotel.image,
                address: detailData.data?.address || '',
                facilities: detailData.data?.facilities || [],
              };
            } catch {
              return { ...hotel, mainImage: hotel.image };
            }
          })
        );

        setHotels(detailedHotels);
      } catch (error) {
        console.error('Hotel fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    getTopHotelsWithDetails();
  }, []);

  const handleClick = (hotel) => {
    if (hotel?.rooms) {
      localStorage.setItem('HotelSearchData', JSON.stringify(searchData));
      localStorage.setItem('roomSelection', JSON.stringify(hotel.rooms));
      localStorage.setItem('selectedHotelMeta', JSON.stringify({
        id: hotel.id,
        stars: hotel.metadata?.stars ?? null,
      }));
    }
  };

  if (loading || !hotels.length) return null;

  return (
    <section className={styles.section} aria-label="Top Hotels">
      <div className="container">
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.tag}>
              <FaHotel className={styles.tagIcon} aria-hidden="true" />
              Haram-side Hotels
            </span>
            <h2 className={`${styles.title} ${playfair.className}`}>
              Top-Rated Hotels
            </h2>
            <p className={styles.subtitle}>
              Hand-picked 4 and 5-star properties within walking distance of the Holy Mosques
            </p>
          </div>

          {/* <Link href="/hotels" className={styles.viewAllBtn}>
            View All Hotels
            <FaArrowRight className={styles.viewAllIcon} aria-hidden="true" />
          </Link> */}
        </header>

        <div className={styles.sliderWrap}>
          {/* <div className={styles.controls}>
            <button
              type="button"
              className={`${styles.navBtn} topHotels-prev`}
              aria-label="Previous hotels"
            >
              <FaArrowLeft />
            </button>
            <button
              type="button"
              className={`${styles.navBtn} topHotels-next`}
              aria-label="Next hotels"
            >
              <FaArrowRight />
            </button>
          </div> */}

          <Swiper
            modules={[Pagination, Navigation]}
            spaceBetween={16}
            slidesPerView={1}
            slidesPerGroup={1}
            watchOverflow
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={{
              nextEl: '.topHotels-next',
              prevEl: '.topHotels-prev',
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
            className={styles.hotelSwiper}
          >
            {hotels.slice(0, 8).map((hotel, index) => (
              <SwiperSlide key={hotel.id ?? index}>
                <Link
                  target="_blank"
                  onClick={() => handleClick(hotel)}
                  href={`/hotels/${makeSlug(hotel.name)}?id=${hotel.id}&code=${providerShortName(hotel.provider)}`}
                  className={styles.cardLink}
                >
                  <article className={styles.card}>
                    <div className={styles.imageWrap}>
                      <Image
                        fill
                        src={hotel.mainImage}
                        alt={hotel.name}
                        className={styles.cardImage}
                        sizes="(max-width: 576px) 90vw, (max-width: 992px) 50vw, 33vw"
                      />

                      <div className={styles.ratingRow}>
                        {renderStars(hotel.rating)}
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.hotelName}>{hotel.name}</h3>

                      {hotel?.location?.city && (
                        <div className={styles.location}>
                          <FaMapMarkerAlt
                            className={styles.locationIcon}
                            aria-hidden="true"
                          />
                          <span>{hotel.location.city}</span>
                        </div>
                      )}

                      <div className={styles.priceRow}>
                        <span className={styles.priceBlock}>
                          <span className={styles.priceFrom}>
                            From{' '}
                            <span className={styles.priceValue}>
                              <PriceDisplay
                                currency={hotel?.metadata?.currency}
                                price={hotel?.metadata?.min_price}
                              />
                            </span>
                            /night
                          </span>
                          <span className={styles.pricePer}>VAT and taxes included</span>
                        </span>

                        <span className={styles.viewBtn}>
                          View
                          <FaArrowRight
                            className={styles.viewBtnIcon}
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}