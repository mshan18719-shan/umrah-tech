'use client';

import React from 'react';
import { Playfair } from 'next/font/google';
import styles from './IncludedExcluded.module.css';

const playfair = Playfair({
  subsets: ['latin'],
  weight: ['600', '700'],
});

// CMS content sometimes includes empty <p> tags (just a <br>, &nbsp;, or
// whitespace) used purely as visual spacing in the original editor. Since
// every <p> here gets its own background pill via CSS, an empty one renders
// as a blank gray box. Strip those out before injecting the HTML.
function stripEmptyParagraphs(html) {
  if (!html) return html;
  return html.replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
}

export default function IncludedExcluded({ included, excluded }) {
  const includedHtml = stripEmptyParagraphs(included) || '<p>No included items listed.</p>';
  const excludedHtml = stripEmptyParagraphs(excluded) || '<p>No excluded items listed.</p>';

  return (
    <section id="includeexclude" className={styles.wrapper}>
      <div className={styles.section}>
        <h3 className={`${styles.sectionTitle} ${playfair.className}`}>What&apos;s Included</h3>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: includedHtml }}
        />
      </div>

      <div className={styles.section}>
        <h3 className={`${styles.sectionTitle} ${playfair.className}`}>What&apos;s Not Included</h3>
        <div
          className={`${styles.content} ${styles.excludedContent}`}
          dangerouslySetInnerHTML={{ __html: excludedHtml }}
        />
      </div>
    </section>
  );
}