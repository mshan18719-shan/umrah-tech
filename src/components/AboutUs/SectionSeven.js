import React from 'react'
import styles from './about.module.css'
import Image from 'next/image'

const features = [
  'Experience Team',
  'Professional',
  'Experience Team',
  'Experience Team',
]

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function SectionSeven() {
  return (
    <div className={styles.sectionSevenWrapper}>
      <div className={styles.sectionSevenInner}>

        {/* Left Image */}
        <div className={styles.sectionSevenLeft}>
          <div className={styles.sectionSevenImgWrap}>
            <Image
              src="/images/about/Group 39.png"
              alt="Our services"
              width={560}
              height={560}
              quality={100}
              className={styles.sectionSevenSingleImg}
            />
          </div>
        </div>

        {/* Right Content */}
        <div className={styles.sectionSevenRight}>
          <h2 className={styles.sectionSevenHeading}>
            We provide
            <br />
            the best Service
          </h2>

          <p className={styles.sectionSevenPara}>
            Discover the Magic of Leonardo Hotel London Croydon with track the March -
            your local tour experts.
          </p>

          <div className={styles.sectionSevenPillGrid}>
            {features.map((feature, i) => (
              <div className={styles.sectionSevenPill} key={i}>
                <span className={styles.sectionSevenPillIcon}>
                  <CheckIcon />
                </span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <button className={styles.sectionSevenBtn}>
            Contact Us <span className={styles.sectionSevenBtnArrow}>&#8594;</span>
          </button>
        </div>

      </div>
    </div>
  )
}