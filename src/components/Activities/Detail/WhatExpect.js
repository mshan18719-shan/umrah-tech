'use client';

import React from 'react';
import styles from './WhatExpect.module.css';

export default function WhatExpect({ expectData }) {
  return (
    <section id="expectation" className={styles.wrapper}>
      <div className={styles.list}>
        {expectData.map((item, index) => (
          <article key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.badge} aria-hidden="true">{index + 1}</span>
              <h4 className={styles.cardTitle}>{item.title}</h4>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardContent}>{item.content}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
