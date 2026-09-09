import React from 'react'
import styles from './about.module.css'
import { FaBullseye, FaEye, FaCheckCircle } from 'react-icons/fa'

const missionPoints = [
  'Make journeys that are memorable and lasting',
  'Offer guidance at every stage of the journey',
  'Make the reservation process easy and simple',
  'Ensure comfort and safety throughout the journey',
]

const visionPoints = [
  'Global leader in Umrah travel services',
  'Trusted by millions of pilgrims worldwide',
  'Setting industry standards for quality',
  'Continuous innovation in travel solutions',
]

export default function SectionFive() {
  return (
    <div className={styles.sectionFiveWrapper}>
      <div className={styles.sectionFiveHeadingWrap}>
        <h2 className={styles.sectionFiveHeading}>Our Mission &amp; Vision</h2>
        <p className={styles.sectionFiveSubheading}>
          Guided by faith and driven by excellence, we strive to serve pilgrims with dedication and care
        </p>
      </div>

      <div className={styles.sectionFiveGrid}>

        {/* Our Mission */}
        <div className={`${styles.sectionFiveCard} ${styles.sectionFiveCardLight}`}>
          <div className={`${styles.sectionFiveIconBox} ${styles.sectionFiveIconBoxLight}`}>
            <FaBullseye />
          </div>
          <h3 className={styles.sectionFiveCardTitle}>Our Mission</h3>
          <p className={styles.sectionFiveCardText}>
            To provide comprehensive, reliable, and spiritually enriching Umrah experiences that help
            pilgrims perform their sacred duties with ease, comfort, and peace of mind.
          </p>
          <ul className={styles.sectionFiveList}>
            {missionPoints.map((point, i) => (
              <li className={styles.sectionFiveListItem} key={i}>
                <FaCheckCircle className={styles.sectionFiveCheckIcon} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Our Vision */}
        <div className={`${styles.sectionFiveCard} ${styles.sectionFiveCardDark}`}>
          <div className={`${styles.sectionFiveIconBox} ${styles.sectionFiveIconBoxDark}`}>
            <FaEye />
          </div>
          <h3 className={styles.sectionFiveCardTitle}>Our Vision</h3>
          <p className={styles.sectionFiveCardText}>
            To become the world&apos;s most trusted and respected provider of Islamic travel services,
            known for excellence, integrity, and unwavering commitment to pilgrim satisfaction.
          </p>
          <ul className={styles.sectionFiveList}>
            {visionPoints.map((point, i) => (
              <li className={styles.sectionFiveListItem} key={i}>
                <FaCheckCircle className={styles.sectionFiveCheckIcon} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}