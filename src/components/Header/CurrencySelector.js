'use client'
import React from 'react';
import { useCurrency } from '@/util/currency';
import { LiaAngleDownSolid } from 'react-icons/lia';
import styles from './islamicheader.module.css';

const CurrencySelector = ({ width }) => {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className={styles.currencySelectorWrap}>
      <select
        className={`form-control ${styles.currencySelectorSelect} ${width || ''}`}
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      >
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="SAR">SAR</option>
      </select>
      <LiaAngleDownSolid className={styles.currencySelectorChevron} aria-hidden />
    </div>
  );
};

export default CurrencySelector;
