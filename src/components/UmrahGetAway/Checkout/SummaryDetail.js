import React from 'react'

import styles from './Checkout.module.css';

import PriceDisplay from '@/components/Currency/PriceDisplay';



export default function SummaryDetail({ PricingDetail, packageDetails, type }) {

  const rowClass = type === 'receipt' ? styles.summaryRow : `${styles.summaryRow} small`;



  return (

    <div className={styles.summaryCard}>

      <div className={styles.summaryCardHeader}>

        <h5 className={styles.summaryCardTitle}>Price Breakdown</h5>

      </div>



      <div className={styles.summaryCardBody}>

        <div className="d-flex flex-column gap-3">

          <div className={rowClass}>

            <span className={styles.summaryRowLabel}>Flights</span>

            <span className={styles.summaryRowValue}>

              <PriceDisplay price={Number(PricingDetail?.flight_price)} currency={PricingDetail?.currency} />

            </span>

          </div>

          <div className={rowClass}>

            <span className={styles.summaryRowLabel}>Makkah Hotel</span>

            <span className={styles.summaryRowValue}>

              <PriceDisplay price={Number(PricingDetail?.makkah_hotel_price)} currency={PricingDetail?.currency} />

            </span>

          </div>

          <div className={rowClass}>

            <span className={styles.summaryRowLabel}>Madinah Hotel</span>

            <span className={styles.summaryRowValue}>

              <PriceDisplay price={Number(PricingDetail?.madinah_hotel_price)} currency={PricingDetail?.currency} />

            </span>

          </div>

          {packageDetails?.transfer_selected_id !== null && (

            <div className={rowClass}>

              <span className={styles.summaryRowLabel}>Transfers</span>

              <span className={styles.summaryRowValue}>

                <PriceDisplay price={Number(PricingDetail?.transfer_price)} currency={PricingDetail?.currency} />

              </span>

            </div>

          )}

          {packageDetails?.visa_selected_id !== null && (

            <div className={rowClass}>

              <span className={styles.summaryRowLabel}>Visa</span>

              <span className={styles.summaryRowValue}>

                <PriceDisplay price={Number(PricingDetail?.visa_price)} currency={PricingDetail?.currency} />

              </span>

            </div>

          )}

        </div>



        <hr className={styles.summaryDivider} />



        <div className={rowClass}>

          <span className={styles.summaryRowLabel}>Subtotal</span>

          <span className={styles.summaryRowValue}>

            <PriceDisplay price={Number(PricingDetail?.total_price)} currency={PricingDetail?.currency} />

          </span>

        </div>



        <hr className={styles.summaryDivider} />



        <div className={styles.summaryTotalRow}>

          <span className={styles.summaryTotalLabel}>Total</span>

          <div className={styles.visaTotalAmount}>

            <PriceDisplay price={Number(PricingDetail?.total_price)} currency={PricingDetail?.currency} />

          </div>

        </div>



        <span className={styles.summaryVatNote}>VAT and taxes included in total price</span>

      </div>

    </div>

  )

}


