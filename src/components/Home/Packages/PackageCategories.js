'use client'
import { useEffect, useState } from "react";
import { Playfair_Display } from 'next/font/google';
import { FaStar } from 'react-icons/fa';
import PackageSlider from "./PackageSlider";
import { Loader } from '@mantine/core';
import styles from './PackageCategories.module.css';

const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['600', '700'],
});
export default function PackageCategories({ categories, initialSlug, initialPackages }) {
    const [activeSlug, setActiveSlug] = useState(initialSlug);
    const [packagesList, setPackagesList] = useState(initialPackages);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setPackagesList(initialPackages);
    }, [initialPackages]);
    const handleCategoryClick = async (slug) => {
        setActiveSlug(slug);
        setLoading(true);

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/packages/search?category_slug=${slug !== 'all' ? slug : ''}`,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    //  "ngrok-skip-browser-warning": "true" 
                }
            }
        );

        const data = await res.json();
        setPackagesList(data?.Content?.packages || []);
        setLoading(false);
    };

    return (
        <div className="gray-simple home-package-section">
            <div className="section-gap">
                <header className={styles.header}>
                    <span className={styles.tag}>
                        <FaStar className={styles.tagIcon} aria-hidden="true" />
                        Featured Packages
                    </span>
                    <h2 className={`${styles.title} ${playfair.className}`}>
                        Featured Spiritual Journeys
                    </h2>
                    <p className={styles.subtitle}>
                        Carefully curated Umrah packages designed to make your spiritual journey unforgettable
                    </p>
                </header>
                <div className="my-5">

                    <div className={`navTabbs d-flex home-package-category-wrapper align-items-center justify-content-center w-100 mt-5 mb-2 ${styles.categoryTabs}`}>
                        <ul className="nav nav-pills gap-2 lights medium justify-content-center mb-3" id="searchTabs" role="tablist">
                            <li className="nav-item mt-1" role="presentation">
                                <button
                                    className={`nav-link ${activeSlug === 'all' ? "active" : ""} pakage-btn`}
                                    onClick={() => handleCategoryClick('all')}
                                    id={`tab-all`}
                                    data-bs-toggle="tab"
                                    data-bs-target={`#tab-pane-all`}
                                    type="button"
                                    role="tab"
                                    aria-controls={`tab-pane-all`}
                                    aria-selected="true"
                                >
                                    All
                                </button>
                            </li>
                            {categories.map((item, index) => (
                                <li key={index} className="nav-item mt-1 pakage-btn" role="presentation">
                                    <button
                                        className={`nav-link ${activeSlug === item.slug ? "active" : ""}`}
                                        onClick={() => handleCategoryClick(item.slug)}
                                        id={`tab-${item.id}`}
                                        data-bs-toggle="tab"
                                        data-bs-target={`#tab-pane-${item.id}`}
                                        type="button"
                                        role="tab"
                                        aria-controls={`tab-pane-${item.id}`}
                                        aria-selected="true"
                                    >
                                        {item.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '30em' }}>
                        <Loader color="blue" size='lg' type="dots" />
                    </div>
                ) : (
                    <div className="container">
                        <PackageSlider packages={packagesList} />
                    </div>
                )}

            </div>
        </div>
    );
}