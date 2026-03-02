import { getCurrencyConfig } from './render';

export const getQuotaPerUnit = () => {
  const raw = parseFloat(localStorage.getItem('quota_per_unit') || '1');
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
};

export const quotaToDisplayAmount = (quota) => {
  const q = Number(quota || 0);
  if (!Number.isFinite(q) || q <= 0) return 0;
  const { type, rate } = getCurrencyConfig();
  if (type === 'TOKENS') return q;
  const usd = q / getQuotaPerUnit();
  if (type === 'USD') return usd;
  return usd * (rate || 1);
};

export const displayAmountToQuota = (amount) => {
  const val = Number(amount || 0);
  if (!Number.isFinite(val) || val <= 0) return 0;
  const { type, rate } = getCurrencyConfig();
  if (type === 'TOKENS') return Math.round(val);
  const usd = type === 'USD' ? val : val / (rate || 1);
  return Math.round(usd * getQuotaPerUnit());
};

export const getQuotaPresets = (usdAmounts) => {
  const amounts = usdAmounts || [1, 10, 50, 100, 500, 1000];
  const unit = getQuotaPerUnit();
  const { symbol, rate, type } = getCurrencyConfig();
  return amounts.map((usd) => {
    const value = Math.round(usd * unit);
    let label;
    if (type === 'TOKENS') {
      if (value >= 1000000) {
        label = (value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1) + 'M';
      } else if (value >= 1000) {
        label = (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'K';
      } else {
        label = String(value);
      }
    } else {
      const displayAmount = type === 'USD' ? usd : usd * rate;
      const formatted = Number.isInteger(displayAmount) ? String(displayAmount) : displayAmount.toFixed(2);
      label = formatted + symbol;
    }
    return { value, label };
  });
};
