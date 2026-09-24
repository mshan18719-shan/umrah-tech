import { CurrencyConverter } from "./CurrencyConverter";

export const ConvertPrice = (price, originalCurrency, currency, rates) => {
  let displayPrice = Number(price);
  let displayCurrency = originalCurrency;

  if (!Number.isFinite(displayPrice)) {
    displayPrice = 0;
  }

  try {
    if (
      currency &&
      originalCurrency &&
      currency !== originalCurrency &&
      rates?.[originalCurrency] &&
      rates?.[currency]
    ) {
      displayPrice = CurrencyConverter(displayPrice, originalCurrency, currency, rates);
      displayCurrency = currency;
    } else if (currency && currency === originalCurrency) {
      displayCurrency = currency;
    }
  } catch (error) {
    console.warn("Currency conversion failed. Falling back to original.", error);
  }

  return {
    newcurrency: displayCurrency,
    newprice: Number.isFinite(Number(displayPrice)) ? Number(displayPrice) : 0,
  };
};
