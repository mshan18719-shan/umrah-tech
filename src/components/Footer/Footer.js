import React from "react";
import styles from "./footer.module.css";
import Image from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaPhone,
  FaMailBulk,
  FaAngleRight,
  FaInstagram,
  FaTiktok,
  FaArrowRight,
  FaRegClock,
} from "react-icons/fa";
import { FaLocationPin, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className={styles.footerWrapper}>

      {/* ─── CTA / HERO SECTION ────────────────────────────── */}
      <div className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Begin Your Sacred Journey?</h2>
            <p className={styles.ctaSubtitle}>
              Speak to our Umrah specialists today for a free, no-obligation
              consultation and personalized quote.
            </p>

            <div className={styles.ctaButtons}>
              <Link href="/contact-us" className={styles.primaryBtn}>
                Get a Free Quote
                <FaArrowRight aria-hidden="true" />
              </Link>
              <a href="/" className={styles.secondaryBtn}>
                <FaPhone aria-hidden="true" className={styles.phoneFlip} />
                Call Us Now
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FOOTER CONTENT ────────────────────────────────── */}
      <div className={styles.footerBottom}>
        <div className="container">

          <div className="row">

            {/* Logo / About / Social */}
            <div className="col-lg-3 col-md-6 mb-4">
              <div className={styles.footerLogo}>
                <Link href="/">
                  <Image
                    height={70}
                    width={160}
                    src="/images/navlogo.png"
                    alt="footer-logo"
                    className="h-auto"
                  />
                </Link>
              </div>
              <p className={styles.text}>
                Umerahtech, UK-based, ensures your Hajj or Umrah journey is
                meaningful and unforgettable by providing expert guidance,
                accurate travel plans, and professional service at every step.
              </p>
              <div className={styles.socialIcons}>
                <a
                  className="text-decoration-none text-white"
                  target="_blank"
                  href="https://www.facebook.com"
                  aria-label="Visit our Facebook page"
                >
                  <span><FaFacebookF /></span>
                </a>
                <a
                  className="text-decoration-none text-white"
                  target="_blank"
                  href="https://x.com"
                  aria-label="Follow us on X (Twitter)"
                >
                  <span><FaXTwitter /></span>
                </a>
                <a
                  className="text-decoration-none text-white"
                  target="_blank"
                  href="https://www.instagram.com"
                  aria-label="Follow us on Instagram"
                >
                  <span><FaInstagram /></span>
                </a>
                <a
                  className="text-decoration-none text-white"
                  target="_blank"
                  href="https://www.linkedin.com"
                  aria-label="Connect with us on LinkedIn"
                >
                  <span><FaLinkedinIn /></span>
                </a>
              </div>
            </div>

            {/* Packages */}
            <div className="col-lg-3 col-md-6 mb-4">
              <h5 className={styles.heading}>About</h5>
              <ul className={styles.quickLinks}>
                <li>
                  <Link href="/about-us">
                     About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us">
                     Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faqs">
                     FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy">
                     Privacy Policy
                  </Link>
                </li>
                {/* <li>
                  <Link href="/">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy">
                   Refund Policy
                  </Link>
                </li> */}
                <li>
                  <Link href="/terms-and-conditions">
                     Terms and Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="col-lg-3 col-md-6 mb-4">
              <h5 className={styles.heading}>Services</h5>
              <ul className={styles.quickLinks}>
                <li>
                  <Link href="/">
                  Umrah visa
                  </Link>
                </li>
                <li>
                  <Link href="/">
                     Flight Booking
                  </Link>
                </li>
                <li>
                  <Link href="/">
                     Hotel Reservations
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    Airport Transfers
                  </Link>
                </li>
                <li>
                  <Link href="/">
                     Ziyarat Tours
                  </Link>
                </li>
                <li>
                  <Link href="/">
                     Build Your Umrah
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    {/* <FaAngleRight className={styles.linkIcon} />  */}
                    ATOL Protection
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="col-lg-3 col-md-6 mb-4">
              <h5 className={styles.heading}>Contact Us</h5>

              <div className={styles.contactItem}>
                <div className={styles.iconCircle}><FaPhone className={styles.phoneFlip} /></div>
                <div>
                  <a href="/" className="text-decoration-none">
                    +44 2345689321
                  </a>
                </div>
              </div>

              <div className={styles.contactItem}>
                <div className={styles.iconCircle}><FaMailBulk /></div>
                <div>
                  <a href="mailto:info@umrahTech.net" className="text-decoration-none">
                    info@umrahTech.net
                  </a>
                </div>
              </div>

              <div className={styles.contactItem}>
                <div className={styles.iconCircle}><FaLocationPin /></div>
                <div>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                    href="https://www.google.com/maps/place/693a+Stratford+Rd,+Springfield,+Birmingham+B11+4DX/@52.4469259,-1.8602044,162m/data=!3m1!1e3!4m6!3m5!1s0x4870bbeeb8d8a42f:0x236b6f6fb188450d!8m2!3d52.4467704!4d-1.8605181!16s%2Fg%2F11mkj18ckh?entry=ttu&g_ep=EgoyMDI2MDEyNi4wIKXMDSoKLDEwMDc5MjA3M0gBUAM%3D"
                  >
                    JKL Street, ABC City, XYZ Country
                  </a>
                </div>
              </div>

              <div className={styles.contactItem}>
                <div className={styles.iconCircle}><FaRegClock /></div>
                <div>
                  <span className={styles.hoursText}>
                    Mon–Sat: 9am–8pm | Sun: 10am–5pm
                  </span>
                </div>
              </div>
            </div>

          </div>

          <hr className={styles.separator} />

          {/* BOTTOM BAR */}
          <div className={`row ${styles.bottomBar}`}>
            <div className="col-md-6 text-center text-md-start">
              Copyright <b>&copy; {new Date().getFullYear()}</b> All Rights Reserved.
            </div>

            <div className="col-md-6 text-center text-md-end">
              <Link href="/terms-and-conditions" className={styles.bottomLink}>
                Terms and Conditions
              </Link>
              <Link href="/privacy-policy" className={styles.bottomLink}>
                Privacy Policy
              </Link>
              <Link href="/" className={styles.bottomLink}>
                Cookie Policy
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}