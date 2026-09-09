'use client'
import React from "react";
import { FaPlane, FaMapMarkerAlt, FaCompass } from "react-icons/fa";
import styles from "./ActivityLoader.module.css";

const ActivityLoader = () => {
  return (
    <div className={styles.loaderContainer}>
      {/* Animated orbiting icons */}
      <div className={styles.orbitContainer}>
        {/* Outer rotating ring */}
        <div className={styles.outerRing} />
        
        {/* Middle pulsing ring */}
        <div className={styles.middleRing} />

        {/* Center icon */}
        <div className={styles.centerIcon}>
          <div className={styles.centerIconInner}>
            <FaCompass className={styles.compassIcon} />
          </div>
        </div>

        {/* Orbiting icon 1 (Plane) */}
        <div className={styles.orbitingIcon1}>
          <div className={styles.orbitingIcon1Inner}>
            <FaPlane className={styles.planeIcon} />
          </div>
        </div>

        {/* Orbiting icon 2 (MapPin) */}
        <div className={styles.orbitingIcon2}>
          <div className={styles.orbitingIcon2Inner}>
            <FaMapMarkerAlt className={styles.mapPinIcon} />
          </div>
        </div>
      </div>

      {/* Text */}
      <div className={styles.textSection}>
        <h3 className={styles.mainTitle}>
          Finding experiences for you
        </h3>
        <p className={styles.subTitle}>
          Curating the best activities from local experts…
        </p>
      </div>

      {/* Animated dots bar */}
      <div className={styles.dotsContainer}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
    </div>
  );
};

export default ActivityLoader;
