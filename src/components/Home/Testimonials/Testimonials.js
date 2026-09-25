'use client';

import Image from 'next/image';
import { Playfair_Display } from 'next/font/google';
import { FaStar } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css/pagination';
import styles from './Testimonials.module.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
});

// Static fallback data — replace with an API fetch once the endpoint is live.
const testimonials = [
  {
    id: 1,
    rating: 5,
    quote:
      "UmrahTech made our spiritual journey seamless. From booking to landing in Makkah, every detail was handled professionally. The Pullman ZamZam was breathtaking — we could see the Kaaba from our room.",
    avatar: '/images/testimonials/t1.jpg',
    name: 'Ahmed Al Rashid',
    location: 'London, UK',
    package: 'Deluxe Umrah Experience',
  },
  {
    id: 2,
    rating: 5,
    quote:
      "I traveled with my three children and elderly parents. The family package was perfect — the hotel was spacious, the guided tours were informative, and the 24/7 support gave us complete peace of mind.",
    avatar: '/images/testimonials/t2.jpg',
    name: 'Fatima Hassan',
    location: 'Birmingham, UK',
    package: 'Family Umrah Package',
  },
  {
    id: 3,
    rating: 5,
    quote:
      "This was my fourth Umrah and I wish I had discovered UmrahTech sooner. The Build Your Own Umrah tool let me customize everything exactly as I wanted. Outstanding service throughout.",
    avatar: '/images/testimonials/t3.jpg',
    name: 'Muhammad Siddiqui',
    location: 'Manchester, UK',
    package: 'Custom Umrah Build',
  },
];

const renderStars = (rating) => {
  const count = Math.min(5, Math.max(0, Math.floor(Number(rating) || 5)));
  return Array.from({ length: count }, (_, i) => (
    <FaStar key={i} className={styles.star} aria-hidden="true" />
  ));
};

export default function Testimonials() {
  if (!testimonials.length) return null;

  return (
    <section className={styles.section} aria-label="Testimonials">
      <div className="container">
        <header className={styles.header}>
          <span className={styles.tag}>
            <FaStar className={styles.tagIcon} aria-hidden="true" />
            Testimonials
          </span>
          <h2 className={`${styles.title} ${playfair.className}`}>
            Stories from Our Pilgrims
          </h2>
        </header>

        <div className={styles.sliderWrap}>
          <Swiper
            modules={[Pagination, Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            slidesPerGroup={1}
            watchOverflow
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={{
              nextEl: '.testimonials-next',
              prevEl: '.testimonials-prev',
            }}
            breakpoints={{
              0: {
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 24,
              },
              992: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 24,
              },
            }}
            className={styles.testimonialSwiper}
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={testimonial.id ?? index}>
                <article className={styles.card}>
                  <div className={styles.ratingRow}>
                    {renderStars(testimonial.rating)}
                  </div>

                  <p className={styles.quoteText}>{testimonial.quote}</p>

                  <div className={styles.footer}>
                    <div className={styles.avatarWrap}>
                      <Image
                        fill
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className={styles.avatar}
                        sizes="44px"
                      />
                    </div>

                    <div className={styles.person}>
                      <span className={styles.name}>{testimonial.name}</span>
                      {testimonial.location && (
                        <span className={styles.location}>
                          {testimonial.location}
                        </span>
                      )}
                    </div>

                    {testimonial.package && (
                      <span className={styles.badge}>
                        {testimonial.package}
                      </span>
                    )}
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}