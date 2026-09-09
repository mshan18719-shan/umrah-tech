import React from 'react'
import styles from './Checkout.module.css';
import { FaPassport } from 'react-icons/fa';
import { FaRegCircleCheck } from 'react-icons/fa6';
import { FiAlertCircle } from "react-icons/fi";

export default function VisaDetail({ VisaDetail, type }) {

  const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== "string") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const checklistItems = [
    'Valid passport (6+ months validity)',
    'Passport-size photographs',
    'Hotel booking confirmation',
    'Return flight tickets',
  ];

  return (
    <div className={styles.sectionCard}>
      {VisaDetail.map((visa, index) => (
        <div key={index}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <div className={styles.usectiontitleIconBox}>
                <FaPassport size={22} className={styles.usectiontitleIcon} />
              </div>
              <div>
                <div className={styles.usectiontitleTitle}>
                  {capitalizeFirstLetter(visa?.visa_type)}
                </div>
                <p className={styles.usectiontitleSubtitle}>
                  Quick and hassle-free visa processing with expert assistance.
                </p>
              </div>
            </div>
          </div>
          <div className={styles.visaDescriptionBox}>
            {visa?.description}
          </div>
        </div>
      ))}

      {type !== 'receipt' && (
        <div>
          <p className={styles.visaChecklistTitle}>Document Checklist</p>
          <div className="d-flex flex-column gap-3">
            {checklistItems.map((item) => (
              <div key={item} className={styles.visaCheckItem}>
                <FaRegCircleCheck className={styles.visaCheckIcon} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {type !== 'receipt' && (
        <div className={styles.visaAlertBox}>
          <FiAlertCircle className={styles.visaAlertIcon} />
          <p className="small text-muted mb-0">
            Our visa team will contact you within 24 hours to collect additional
            documents if required.
          </p>
        </div>
      )}
    </div>
  )
}
