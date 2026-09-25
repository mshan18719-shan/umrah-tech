'use client';

import { Playfair_Display } from 'next/font/google';
import { Accordion } from '@mantine/core';
import { FaChevronDown } from 'react-icons/fa';
import styles from './Faqsection.module.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
});

const faqData = [
  {
    id: 'q1',
    question: 'What documents do I need for Umrah?',
    answer:
      'UmrahTech offers complete Hajj and Umrah services, such as visa processing, flights, hotel bookings, ground transportation, guided tours, and Ziyarat tours, to be able to make the journey smooth and spiritually complete.',
  },
  {
    id: 'q2',
    question: 'How far in advance should I book?',
    answer:
      'We recommend booking your Umrah package at least 6-8 weeks in advance. Early booking guarantees better hotel availability, preferred flight timings, and helps us process your visa without any last-minute delays.',
  },
  {
    id: 'q3',
    question: 'Can I customize my Umrah package?',
    answer:
      'Yes. With our Build Your Own Umrah tool, you can choose your own hotels, flight dates, transport, and Ziyarat tours to create a package that fits your budget and preferences exactly.',
  },
  {
    id: 'q4',
    question: 'Are flights included in all packages?',
    answer:
      'Most of our packages include return flights, but we also offer land-only packages for pilgrims who wish to arrange their own flights. Our team can confirm what is included before you book.',
  },
  {
    id: 'q5',
    question: 'Is there 24/7 support during Umrah?',
    answer:
      'Yes. Our team is available around the clock while you are in Makkah and Madinah, so you always have someone to contact for any assistance you may need during your pilgrimage.',
  },
];

export default function FaqSection() {
  return (
    <section className={styles.section} aria-label="Frequently Asked Questions">
      <div className="container">
        <header className={styles.header}>
          <h2 className={`${styles.title} ${playfair.className}`}>
            Frequently Asked Questions
          </h2>
          <p className={styles.subtitle}>
            Everything you need to know about planning your Umrah
          </p>
        </header>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <Accordion
              defaultValue="q1"
              radius="lg"
              variant="separated"
              chevron={<FaChevronDown className={styles.chevron} />}
              classNames={{
                item: styles.item,
                control: styles.control,
                panel: styles.panel,
                label: styles.label,
              }}
            >
              {faqData.map((faq) => (
                <Accordion.Item key={faq.id} value={faq.id}>
                  <Accordion.Control>{faq.question}</Accordion.Control>
                  <Accordion.Panel>{faq.answer}</Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}