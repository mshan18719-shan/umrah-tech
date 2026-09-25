'use client';

import React from 'react';
import { Accordion } from '@mantine/core';
import { Playfair_Display } from 'next/font/google';
import { FaChevronDown } from 'react-icons/fa';
import styles from './Faqs.module.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
});

const DEFAULT_FAQS = [
  {
    title: 'Is customer support available before and after the activity?',
    description:
      'Yes. Our team is available to help you before you book and after your activity if you need any assistance.',
  },
  {
    title: 'Will there be waiting time or crowd management?',
    description:
      'Some experiences may include short waiting periods during busy times. Operators manage groups to keep the activity safe and enjoyable.',
  },
  {
    title: 'Can I customize my booking?',
    description:
      'You can choose available dates, time slots, and guest options based on what is offered for this activity.',
  },
  {
    title: 'Is transport included with this activity?',
    description:
      'Transport inclusion varies by activity. Please check the inclusions section or contact us to confirm what is covered.',
  },
  {
    title: 'Is there support available during the activity?',
    description:
      'Yes. Activity providers and our support team can assist you if any issues arise before or during your experience.',
  },
];

const getDisplayFaqs = (faqsList, limit = 5) => {
  const fromApi = Array.isArray(faqsList) ? [...faqsList] : [];
  const merged = [...fromApi];

  for (const faq of DEFAULT_FAQS) {
    if (merged.length >= limit) break;

    const exists = merged.some(
      (item) => item?.title?.trim().toLowerCase() === faq.title.trim().toLowerCase()
    );

    if (!exists) merged.push(faq);
  }

  return merged.slice(0, limit);
};

export default function Faqs({ faqsList }) {
  const displayFaqs = getDisplayFaqs(faqsList);

  if (!displayFaqs.length) return null;

  return (
    <section id="faqs" className={styles.section}>
      <header className={styles.header}>
        <h2 className={`${styles.title} ${playfair.className}`}>
          Frequently Asked Questions
        </h2>
        <p className={styles.subtitle}>FAQs about the Experience</p>
      </header>

      <div className={styles.accordionWrap}>
        <Accordion
          variant="separated"
          radius="lg"
          chevron={<FaChevronDown className={styles.chevron} />}
          classNames={{
            item: styles.item,
            control: styles.control,
            panel: styles.panel,
            label: styles.label,
          }}
        >
          {displayFaqs.map((item, index) => (
            <Accordion.Item key={index} value={`faq-${index}`}>
              <Accordion.Control>{item.title}</Accordion.Control>
              <Accordion.Panel>{item.description}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
