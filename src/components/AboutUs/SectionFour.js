import React from 'react'
import styles from './about.module.css'
import Image from 'next/image'

const services = [
  ['Umrah Group Package', 'Advance Tour'],
  ['Ramadan Packages', 'Flights'],
  ['Experience Team', 'Experience Team'],
  ['Experience Team', 'Experience Team'],
]

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17l-5-5" stroke="#16296b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function SectionFour() {
  return (
    <div className={styles.sectionFourWrapper}>
      <div className={styles.sectionFourInner}>
        <div className={styles.sectionFourLeft}>
          <h2 className={styles.sectionFourHeading}>
            We provide
            <br />
            the best Service
          </h2>
          <p className={styles.sectionFourPara}>
            Discover the Magic of Leonardo Hotel London Croydon with track the March - your local tour experts.
          </p>
          <button className={styles.sectionFourBtn}>
            Contact Us <span className={styles.sectionFourBtnArrow}>&#8594;</span>
          </button>
          <div className={styles.sectionFourList}>
            {services.map((row, i) =>
              row.map((item, j) => (
                <div className={styles.sectionFourListItem} key={`${i}-${j}`}>
                  <CheckIcon />
                  <span>{item}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.sectionFourRight}>
          <Image
            src="/images/about/kaaba.png"
            alt="Kaaba"
            fill
            quality={100}
            className={styles.sectionFourImg}
          />
        </div>
      </div>
    </div>
  )
}