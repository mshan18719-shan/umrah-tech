'use client'

import { CurrencyConverter } from './CurrencyConverter';
import { useCurrency } from '@/util/currency';
const PriceDisplay = ({ price, currency: originalCurrency, status }) => {
  const { currency, rates } = useCurrency();

  let displayPrice = price;
  let displayCurrency = originalCurrency;

  try {
    if (currency !== originalCurrency && rates[originalCurrency] && rates[currency]) {
      displayPrice = CurrencyConverter(price, originalCurrency, currency, rates);
      displayCurrency = currency;
    }
  } catch (error) {
    console.warn("Currency conversion failed. Falling back to original.", error);
  }

  if (status === 'price') {
    return displayPrice
  } else {
    if (displayPrice % 2 === 0) {
      return `${displayCurrency} ${displayPrice} `
    } else {
      return `${displayCurrency} ${Number(displayPrice).toFixed(2)} `
    }

  }


}
export default PriceDisplay;

