import React from 'react';
import styles from './Checkout.module.css';

export default function CheckoutSkeleton() {
  return (
    <div className={styles.checkoutPage}>
      <div className={`container ${styles.checkoutContainer}`}>
        <div className={styles.checkoutPageHeader}>
          <div className="placeholder-glow">
            <span className="placeholder rounded" style={{ width: '240px', height: '32px', display: 'block' }}></span>
            <span className="placeholder rounded mt-2" style={{ width: '360px', height: '16px', display: 'block' }}></span>
          </div>
        </div>

        <div className='row py-4 g-4'>
          <div className='col-12 col-md-8'>
            <div className={styles.checkoutMainCol}>
              <div className={styles.tripMetaBar}>
                <div className={styles.tripMetaGrid}>
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className={styles.tripMetaItem}>
                      <span className="placeholder rounded" style={{ width: '38px', height: '38px', flexShrink: 0 }}></span>
                      <div className="placeholder-glow flex-fill">
                        <span className="placeholder rounded d-block" style={{ width: '52px', height: '10px' }}></span>
                        <span className="placeholder rounded d-block mt-1" style={{ width: '72px', height: '14px' }}></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {[1, 2, 3].map((section) => (
                <div key={section} className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionHeaderLeft}>
                      <div className={styles.usectiontitleIconBox}>
                        <span className="placeholder bg-white rounded" style={{ width: '22px', height: '22px' }}></span>
                      </div>
                      <div className="placeholder-glow">
                        <span className="placeholder rounded" style={{ width: '140px', height: '18px', display: 'block' }}></span>
                        <span className="placeholder rounded mt-2" style={{ width: '100px', height: '14px', display: 'block' }}></span>
                      </div>
                    </div>
                  </div>
                  <div className="placeholder-glow">
                    <span className="placeholder rounded w-100" style={{ height: '90px', display: 'block' }}></span>
                  </div>
                </div>
              ))}

              <div className={styles.checkoutActions}>
                <span className="placeholder rounded-pill" style={{ width: '180px', height: '46px' }}></span>
              </div>
            </div>
          </div>

          <div className='col-12 col-md-4'>
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardHeader}>
                <div className="placeholder-glow">
                  <span className="placeholder rounded" style={{ width: '140px', height: '22px', display: 'block' }}></span>
                </div>
              </div>
              <div className={styles.summaryCardBody}>
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="d-flex justify-content-between align-items-center">
                    <span className="placeholder rounded" style={{ width: '100px', height: '14px' }}></span>
                    <span className="placeholder rounded" style={{ width: '60px', height: '14px' }}></span>
                  </div>
                ))}
                <hr className={styles.summaryDivider} />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="placeholder rounded" style={{ width: '60px', height: '20px' }}></span>
                  <span className="placeholder rounded" style={{ width: '90px', height: '28px' }}></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
