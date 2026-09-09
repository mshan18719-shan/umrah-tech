import React from 'react'
import styles from './about.module.css'
import Image from 'next/image'
import { FaCheckCircle, FaCertificate } from 'react-icons/fa'

const features = [
  'Licensed & Certified',
  'Expert Guidance',
  '24/7 Support',
]

export default function SectionSix() {
  return (
    <div className={styles.sectionSixWrapper}>
      <div className={styles.sectionSixInner}>

        {/* Left Content */}
        <div className={styles.sectionSixLeft}>
          <span className={styles.sectionSixBadge}>Our Story</span>

          <h2 className={styles.sectionSixHeading}>
            Serving Pilgrims Since 2005
          </h2>

          <p className={styles.sectionSixPara}>
            AL-HIJAZ TOURS was founded with a simple yet profound mission: to make the
            sacred journey of Umrah accessible, comfortable, and spiritually enriching for
            Muslims worldwide.
          </p>

          <p className={styles.sectionSixPara}>
            For over two decades, we have been dedicated to providing exceptional Umrah
            packages that combine spiritual guidance with premium travel services. Our
            experienced team understands the significance of this blessed journey and
            works tirelessly to ensure every aspect exceeds your expectations.
          </p>

          <p className={styles.sectionSixPara}>
            Our carefully designed Umrah tours from the UK guarantee a convenient and
            spiritually fulfilling journey. With experienced Umrah guides and easy-to-book
            websites through which you can explore packages without compromising quality
            and service.
          </p>

          <div className={styles.sectionSixFeatures}>
            {features.map((feature, i) => (
              <div className={styles.sectionSixFeatureItem} key={i}>
                <FaCheckCircle className={styles.sectionSixFeatureIcon} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Image */}
        <div className={styles.sectionSixRight}>
          <div className={styles.sectionSixImgWrap}>
            <Image
              src="/images/about/madinah.png"
              alt="Al-Masjid an-Nabawi"
              fill
              quality={100}
              className={styles.sectionSixImg}
            />
          </div>

          <div className={styles.sectionSixBadgeCard}>
            <div className={styles.sectionSixBadgeIcon}>
              <FaCertificate />
            </div>
            <div>
              <div className={styles.sectionSixBadgeNumber}>20+</div>
              <div className={styles.sectionSixBadgeLabel}>Years of Excellence</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}