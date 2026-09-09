'use client';

import React from 'react';
import { Accordion } from '@mantine/core';
import styles from './PackageDetailFaqs.module.css';

export default function PackageDetailFaqs({ faqsList = [] }) {
    if (!faqsList.length) return null;

    return (
        <div className={styles.faqsSection}>
            <div className={styles.header}>
                <h3 className={styles.title}>Frequently Asked Questions</h3>
                <p className={styles.subtitle}>
                    Everything you need to know about planning your Umrah
                </p>
            </div>

            <div className={styles.accordionWrap}>
                <Accordion
                    variant="separated"
                    radius="lg"
                    chevronPosition="right"
                    defaultValue={null}
                >
                    {faqsList.map((faq, index) => (
                        <Accordion.Item key={index} value={`question${index + 1}`}>
                            <Accordion.Control>{faq.title}</Accordion.Control>
                            <Accordion.Panel>{faq.description}</Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}
