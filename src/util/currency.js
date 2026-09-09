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
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_CURRENCY_KEY}/latest/GBP`);
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }

        const data = await response.json();
        setRates(data.conversion_rates);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch exchange rates', error);
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
