import React from 'react'
import styles from "../ContactUs.module.css";
import { BsChatDotsFill, BsEnvelopeFill } from 'react-icons/bs';

export default function CTASection() {
  return (
    <div className={styles.ctaJourneyWrapper}>
      <div className={styles.ctaJourneyCard}>
        <h2 className={styles.ctaJourneyHeading}>Begin Your Next Journey</h2>
        <p className={styles.ctaJourneySubheading}>
          Tell us where you&apos;d like to go. We&apos;ll quietly design every detail around you.
        </p>

        <div className={styles.ctaJourneyButtons}>
          <a href="tel:01217772522" className={styles.ctaJourneyBtnPrimary}>
            <BsChatDotsFill /> Speak With Our Concierge
          </a>
          <a href="mailto:info@umrahTech.net" className={styles.ctaJourneyBtnOutline}>
            <BsEnvelopeFill /> Send an Email
          </a>
        </div>
      </div>
    </div>
  )
}