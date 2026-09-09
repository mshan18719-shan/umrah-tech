export const CurrencyConverter = (amount, from, to, rates) => {
  if (!rates[from] || !rates[to]) return amount;
  const baseAmount = amount / rates[from]; // Convert to base (USD)
  const targetAmount = baseAmount * rates[to];
  if (targetAmount % 2 === 0) {
    return targetAmount
  } else {
    return targetAmount.toFixed(2)
  }
};
