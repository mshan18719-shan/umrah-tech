"use client";
import React, { useEffect, useState } from "react";
import styles from "./FlightSearchLoader.module.css";
export default function TransferListingLoader() {
  return (
    <div className={styles.loaderWrapper}>
      {/* Background Orbs */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>
      <div className={styles.orb3}></div>

      {/* Content */}
      <div className={`text-center ${styles.content}`}>
        {/* Airplane + Rings */}
        <div className={styles.airplaneContainer}>
          <div className={styles.outerRing}></div>
          <div className={styles.middleRing}></div>
          <svg
            className={styles.airplane}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <path
                d="M5 6V15.8C5 16.9201 5 17.4802 5.21799 17.908C5.40973 18.2843 5.71569 18.5903 6.09202 18.782C6.51984 19 7.07989 19 8.2 19H15.8C16.9201 19 17.4802 19 17.908 18.782C18.2843 18.5903 18.5903 18.2843 18.782 17.908C19 17.4802 19 16.9201 19 15.8V6M5 6C5 6 5 3 12 3C19 3 19 6 19 6M5 6H19M5 13H19M17 21V19M7 21V19M8 16H8.01M16 16H16.01"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>{" "}
            </g>
          </svg>
        </div>

        {/* Title */}
        <h2 className={styles.title}>Searching Transfers</h2>

        {/* Bouncing Dots */}
        <div
          className={`d-flex justify-content-center gap-2 ${styles.dotsRow}`}
        >
          <div className={styles.dot1}></div>
          <div className={styles.dot2}></div>
          <div className={styles.dot3}></div>
        </div>

        {/* Messages */}
        <div className="mt-3">
          <LoadingMessage />
        </div>

        <p className={styles.subtitle}>Finding the best deals for you</p>

        <div className={styles.bottomGlow}></div>
      </div>
    </div>
  );
}

function LoadingMessage() {
  const messages = [
    "Locating pickup points...",
    "Matching drivers...",
    "Calculating travel time...",
    "Confirming availability...",
    "Almost there...",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return <div className={styles.message}>{messages[index]}</div>;
}
