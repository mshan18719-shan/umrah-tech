import { CurrencyConverter } from "./CurrencyConverter";
export const ConvertPrice = (price, originalCurrency, currency, rates) => {
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

  return { newcurrency: displayCurrency, newprice: displayPrice };
};
