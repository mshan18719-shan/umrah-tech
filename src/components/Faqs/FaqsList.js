'use client'
import React, { useState, useMemo } from 'react'
import { Accordion } from '@mantine/core';

export default function FaqsList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const faqData = [
        {
            id: 'q1',
            category: 'general',
            question: 'What documents do I need for Umrah?',
            answer: 'UmrahTech offers complete Hajj and Umrah services, such as visa processing, flights, hotel bookings, ground transportation, guided tours, and Ziyarat tours, to be able to make the journey smooth and spiritually complete.',
        },
        {
            id: 'q2',
            category: 'booking',
            question: 'How far in advance should I book?',
            answer: 'We recommend booking your Umrah package at least 6-8 weeks in advance. Early booking guarantees better hotel availability, preferred flight timings, and helps us process your visa without any last-minute delays.',
        },
        {
            id: 'q3',
            category: 'booking',
            question: 'Can I customize my Umrah package?',
            answer: 'Yes. With our Build Your Own Umrah tool, you can choose your own hotels, flight dates, transport, and Ziyarat tours to create a package that fits your budget and preferences exactly.',
        },
        {
            id: 'q4',
            category: 'general',
            question: 'Are flights included in all packages?',
            answer: 'Most of our packages include return flights, but we also offer land-only packages for pilgrims who wish to arrange their own flights. Our team can confirm what is included before you book.',
        },
        {
            id: 'q5',
            category: 'general',
            question: 'Is there 24/7 support during Umrah?',
            answer: 'Yes. Our team is available around the clock while you are in Makkah and Madinah, so you always have someone to contact for any assistance you may need during your pilgrimage.',
        },
    ];

    const filteredFaqs = useMemo(() => {
        let filtered = faqData;

        // Filter by category
        if (activeTab !== 'all') {
            filtered = filtered.filter(faq => faq.category === activeTab);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(faq =>
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [activeTab, searchQuery]);

    return (
        <div>
            {/* Hero Section */}
            <section className="page-title-section breadcrum-bg text-center d-flex align-items-center justify-content-center position-relative" style={{ minHeight: '260px', backgroundAttachment: 'scroll' }}>
                <div className='page-title-overlay'></div>
                <div className="container position-relative" style={{ zIndex: 2 }}>
                    <h1 className="text-white fw-bold mb-3">Frequently Asked Questions</h1>
                    <p>Everything you need to know about planning your Umrah</p>
                </div>
            </section>

            {/* Main FAQ Section */}
            <div className='container my-5 pb-5 faqs-page'>
                {/* Category Tabs */}
                {/* <div className="mb-4">
                    <Tabs value={activeTab} onChange={setActiveTab} className="faq-tabs border-0">
                        <Tabs.List className="justify-content-center flex-wrap border-0 mb-4">
                            <Tabs.Tab 
                                value="all" 
                                leftSection={<FaRegQuestionCircle />}
                                className="px-4 py-2"
                            >
                                All Questions
                            </Tabs.Tab>
                            <Tabs.Tab 
                                value="general" 
                                leftSection={<MdTravelExplore />}
                                className="px-4 py-2"
                            >
                                General
                            </Tabs.Tab>
                            <Tabs.Tab 
                                value="hajj" 
                                leftSection={<FaPlane />}
                                className="px-4 py-2"
                            >
                                Hajj
                            </Tabs.Tab>
                            <Tabs.Tab 
                                value="umrah" 
                                leftSection={<FaMapMarkerAlt />}
                                className="px-4 py-2"
                            >
                                Umrah
                            </Tabs.Tab>
                            <Tabs.Tab 
                                value="visa" 
                                leftSection={<FaPassport />}
                                className="px-4 py-2"
                            >
                                Visa & Documents
                            </Tabs.Tab>
                            <Tabs.Tab 
                                value="booking" 
                                leftSection={<FaCreditCard />}
                                className="px-4 py-2"
                            >
                                Booking
                            </Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                </div> */}

                {/* FAQ Accordion */}
                <div className='row justify-content-center'>
                    <div className='col-lg-10'>
                            <Accordion
                                defaultValue="q1"
                                radius="lg"
                                variant="separated"
                                classNames={{
                                    item: 'faq-item shadow-sm mb-3 border',
                                    control: 'faq-control',
                                    panel: 'faq-panel'
                                }}
                            >
                                {filteredFaqs.map((faq) => (
                                    <Accordion.Item key={faq.id} value={faq.id}>
                                        <Accordion.Control>
                                            <span className="fw-semibold">{faq.question}</span>
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            <p className="text-muted mb-0" style={{ lineHeight: '1.8' }}>
                                                {faq.answer}
                                            </p>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                    </div>
                </div>
            </div>

            {/* Contact Section */}
            {/* <section className="bg-light py-5 border-top">
                <div className="container">
                    <div className="row justify-content-center text-center">
                        <div className="col-lg-8">
                            <h3 className="fw-bold mb-3">Still Have Questions?</h3>
                            <p className="text-muted mb-4">
                                Can't find the answer you're looking for? Our customer support team is here to help you 24/7.
                            </p>
                            <div className="row justify-content-center g-3">
                                <div className="col-md-4">
                                    <div className="card border-0 shadow-sm h-100 hover-lift">
                                        <div className="card-body p-4">
                                            <FaPhoneAlt className="text-success mb-3" style={{ fontSize: '2rem' }} />
                                            <h6 className="fw-semibold mb-2">Phone Support</h6>
                                            <a href="tel:01217772522" className="text-decoration-none">
                                                <p className="text-muted small mb-0">0121 777 2522</p>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card border-0 shadow-sm h-100 hover-lift">
                                        <div className="card-body p-4">
                                            <FaEnvelope className="text-success mb-3" style={{ fontSize: '2rem' }} />
                                            <h6 className="fw-semibold mb-2">Email Us</h6>
                                            <a href="mailto:info@umrahTech.net" className="text-decoration-none">
                                                <p className="text-muted small mb-0">info@umrahTech.net</p>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card border-0 shadow-sm h-100 hover-lift">
                                        <div className="card-body p-4">
                                            <FaRegQuestionCircle className="text-success mb-3" style={{ fontSize: '2rem' }} />
                                            <h6 className="fw-semibold mb-2">Contact Form</h6>
                                            <Link href="/contact-us" className="text-decoration-none">
                                                <button className="btn btn-success btn-sm mt-2">Get in Touch</button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

            <style jsx>{`
                .faq-item {
                    background: white;
                    transition: all 0.3s ease;
                }
                .faq-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important;
                }
                .faq-control {
                    padding: 1.25rem 1.5rem;
                    font-size: 1.05rem;
                }
                .faq-panel {
                    padding: 1.25rem 1.5rem;
                }
                .hover-lift {
                    transition: all 0.3s ease;
                }
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
                }
                :global(.faq-tabs .mantine-Tabs-tab) {
                    border: 1px solid #dee2e6;
                    border-radius: 50px;
                    margin: 0.25rem;
                    transition: all 0.3s ease;
                }
                :global(.faq-tabs .mantine-Tabs-tab:hover) {
                    background-color: #f8f9fa;
                    border-color: #198754;
                }
                :global(.faq-tabs .mantine-Tabs-tab[data-active]) {
                    background-color: #198754;
                    color: white;
                    border-color: #198754;
                }
                :global(.faq-tabs .mantine-Tabs-tab[data-active]:hover) {
                    background-color: #157347;
                }
            `}</style>
        </div>
    )
}