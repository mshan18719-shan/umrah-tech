import React from 'react'
import styles from '../Checkout/Checkout.module.css';
import { FaPassport } from 'react-icons/fa';
import { FaRegCircleCheck } from 'react-icons/fa6';
import { FiAlertCircle } from "react-icons/fi";

export default function VisaDetail({ VisaDetail, type }) {

  const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== "string") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const tableStyle = { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.82rem' };
  const theadTrStyle = { background: '#d4a84b', color: '#1a1a1a' };
  const thStyle = { padding: '0.65rem 1rem', fontWeight: 700, letterSpacing: '0.07em', fontSize: '0.7rem', textTransform: 'uppercase', border: 'none' };
  const srThStyle = { ...thStyle, width: 40, textAlign: 'center' };
  const tdStyle = { padding: '0.7rem 1rem', color: '#333', verticalAlign: 'middle', border: 'none', borderBottom: '1px solid #ececec' };
  const srTdStyle = { ...tdStyle, width: 40, textAlign: 'center', fontWeight: 700, color: '#1a1a1a' };

  return (
    <div style={{ borderBottom: '1px solid #e8e8e8', marginTop: '0' }}>
      {VisaDetail.map((visa, index) => (
        <div key={index}>
          <div style={{ background: '#004c4c', color: '#ffffff', padding: '0.65rem 1.5rem', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: '#c49a2a', borderRadius: 4, flexShrink: 0 }}>
              <FaPassport size={12} />
            </span>
            VISA DETAILS
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.45), rgba(255,255,255,0))' }} />
          </div>
          <table style={tableStyle}>
            <thead>
              <tr style={theadTrStyle}>
                <th style={srThStyle}>#</th>
                <th style={thStyle}>Visa Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={srTdStyle}>{index + 1}</td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{capitalizeFirstLetter(visa?.visa_type)}</div>
                  {visa?.description && <div style={{ fontSize: '0.78rem', color: '#555' }}>{visa.description}</div>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      {type !== 'receipt' && (
        <div>
          <p className="fw-medium text-black mt-2 mb-3">Document Checklist</p>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-3">
              <FaRegCircleCheck className={styles.visaCheckIcon} />
              <span className="small">Valid passport (6+ months validity)</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <FaRegCircleCheck className={styles.visaCheckIcon} />
              <span className="small">Passport-size photographs</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <FaRegCircleCheck className={styles.visaCheckIcon} />
              <span className="small">Hotel booking confirmation</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <FaRegCircleCheck className={styles.visaCheckIcon} />
              <span className="small">Return flight tickets</span>
            </div>
          </div>
        </div>
      )}
      {type !== 'receipt' && (
        <div className={`${styles.visaAlertBox} rounded-4 p-4 mt-4`}>
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
