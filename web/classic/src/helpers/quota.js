/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { getCurrencyConfig } from './render';

export const getQuotaPerUnit = () => {
  const raw = parseFloat(localStorage.getItem('quota_per_unit') || '1');
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
};

export const quotaToDisplayAmount = (quota) => {
  const q = Number(quota || 0);
  if (!Number.isFinite(q) || q === 0) return 0;
  const sign = Math.sign(q);
  const abs = Math.abs(q);
  const { type, rate } = getCurrencyConfig();
  if (type === 'TOKENS') return q;
  const usd = abs / getQuotaPerUnit();
  if (type === 'USD') return sign * usd;
  return sign * usd * (rate || 1);
};

export const displayAmountToQuota = (amount) => {
  const val = Number(amount || 0);
  if (!Number.isFinite(val) || val === 0) return 0;
  const sign = Math.sign(val);
  const abs = Math.abs(val);
  const { type, rate } = getCurrencyConfig();
  if (type === 'TOKENS') return Math.round(val);
  const usd = type === 'USD' ? abs : abs / (rate || 1);
  return sign * Math.round(usd * getQuotaPerUnit());
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
