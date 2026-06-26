export const normalizeMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

export const splitAmount = (amount, commissionPct) => {
  const gross = normalizeMoney(amount);
  const rate = Math.min(Math.max(Number(commissionPct) || 0, 0), 100) / 100;
  const barber = Math.round(gross * rate * 100) / 100;
  const house = Math.round((gross - barber) * 100) / 100;
  return { gross, barber, house };
};
