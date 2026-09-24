export const CurrencyConverter = (amount, from, to, rates) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 0;
  if (!rates?.[from] || !rates?.[to]) return numericAmount;
  const baseAmount = numericAmount / rates[from];
  const targetAmount = baseAmount * rates[to];
  // Always return a number (toFixed returns a string and breaks price filters)
  return Math.round(targetAmount * 100) / 100;
};
