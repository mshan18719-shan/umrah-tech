'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

const PackageCategoriesContext = createContext({ categories: [], loading: true });

export const PackageCategoriesProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/packages/categories`,
                    {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
                const data = await response.json();
                const sorted = (data?.Content?.categories || []).sort(
                    (a, b) => Number(a.sort_order) - Number(b.sort_order)
                );
                setCategories(sorted);
            } catch (error) {
                console.error('Error fetching package categories:', error);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        // Defer fetch until the page is fully loaded so it doesn't compete
        // with critical resources during initial page load.
        if (document.readyState === 'complete') {
            // Page already loaded (e.g. hot-reload / client navigation)
            if ('requestIdleCallback' in window) {
                requestIdleCallback(fetchCategories);
            } else {
                setTimeout(fetchCategories, 0);
            }
        } else {
            window.addEventListener('load', () => {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(fetchCategories);
                } else {
                    setTimeout(fetchCategories, 0);
                }
            }, { once: true });
        }
    }, []);

    return (
        <PackageCategoriesContext.Provider value={{ categories, loading }}>
            {children}
        </PackageCategoriesContext.Provider>
    );
};

export const usePackageCategories = () => useContext(PackageCategoriesContext);
