import React from 'react'
import styles from './Checkout.module.css';
import { FaArrowRight, FaCar } from 'react-icons/fa';
import { GiGearStickPattern } from 'react-icons/gi';

export default function Transfer({ TransferData }) {

  const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== "string") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div>
      {TransferData.map((transfer, index) => (
        <div key={index} className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <div className={styles.usectiontitleIconBox}>
                <FaCar size={22} className={styles.usectiontitleIcon} />
              </div>
              <div>
                <div className={styles.usectiontitleTitle}>
                  Private Transfer
                </div>
                <p className={styles.usectiontitleSubtitle}>
                  {capitalizeFirstLetter(transfer?.vehicle_details?.name)} · {capitalizeFirstLetter(transfer?.vehicle)} ({capitalizeFirstLetter(transfer?.trip_type)})
                </p>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-1">
            <span className={styles.hotelAmenity}>
              <GiGearStickPattern /> {transfer?.vehicle_details?.transmission_type}
            </span>
            <span className={styles.hotelAmenity}>
              {transfer?.vehicle_details?.passenger_capacity} Passengers
            </span>
            <span className={styles.hotelAmenity}>
              {transfer?.vehicle_details?.luggage_capacity} Luggage
            </span>
          </div>

          {transfer?.locations?.map((location, locIndex) => (
            <div key={locIndex} className={styles.transferCard}>
              <div className={styles.transferRouteRow}>
                <div className="flex-fill">
                  <p className={styles.transferRouteLabel}>From</p>
                  <p className={styles.transferRouteValue}>{location?.pickup_address}</p>
                </div>

                <div className={styles.transferArrow}>
                  <FaArrowRight className={styles.transferArrowIcon} />
                </div>

                <div className="flex-fill">
                  <p className={styles.transferRouteLabel}>To</p>
                  <p className={styles.transferRouteValue}>{location?.dropoff_address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
