'use client';

import { Playfair } from 'next/font/google';
import { FaShieldAlt, FaClock, FaStar, FaGlobe } from 'react-icons/fa';
import styles from './Chooseus.module.css';

const playfair = Playfair({
  subsets: ['latin'],
  weight: ['600', '700'],
});

const features = [
  {
    id: 1,
    icon: FaShieldAlt,
    title: 'ATOL Protected',
    description:
      'All packages are fully bonded and ATOL protected for complete financial peace of mind.',
  },
  {
    id: 2,
    icon: FaClock,
    title: '24/7 In-Destination Support',
    description:
      'Our teams in Makkah and Madinah are available around the clock during your pilgrimage.',
  },
  {
    id: 3,
    icon: FaStar,
    title: 'Expert Umrah Consultants',
    description:
      'Experienced consultants who have performed Umrah themselves guide every booking.',
  },
  {
    id: 4,
    icon: FaGlobe,
    title: 'Best Price Guarantee',
    description:
      'We match or beat any like-for-like quote. Quality Umrah should be accessible to all.',
  },
];

export default function Chooseus() {
  return (
    <section className={styles.section} aria-label="Why Choose Us">
      <div className="container">
        <header className={styles.header}>
          <h2 className={`${styles.title} ${playfair.className}`}>
            Why Choose UmrahTech?
          </h2>
          <p className={styles.subtitle}>
            We combine cutting-edge technology with deep Islamic travel
            expertise
          </p>
        </header>

        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className="col" key={feature.id}>
                <div className={styles.card}>
                  <div className={styles.iconWrap}>
                    <Icon className={styles.icon} aria-hidden="true" />
                  </div>
                  <h3 className={styles.cardTitle}>{feature.title}</h3>
                  <p className={styles.cardText}>{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}