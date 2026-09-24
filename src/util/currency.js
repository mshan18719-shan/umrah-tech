'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('GBP');
  const [rates, setRates] = useState({ GBP: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
    const fetchRates = async () => {
      try {
        const key = process.env.NEXT_PUBLIC_CURRENCY_KEY;
        if (!key) {
          setLoading(false);
          return;
        }
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${key}/latest/GBP`
        );
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data?.conversion_rates && typeof data.conversion_rates === 'object') {
          setRates(data.conversion_rates);
        }
      } catch (error) {
        // Keep fallback GBP rate; avoid throwing so pages (invoice/voucher) still render
        console.warn('Exchange rates unavailable, using fallback rates');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);
  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
