import { CURRENCIES } from '../data/currencies';

export function formatMoney(value, currency = 'KES') {
  const symbol = CURRENCIES[currency]?.symbol ?? `${currency} `;
  const amount = Number(value || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${symbol}${amount}`;
}

export function formatDate(dateString) {
  if (!dateString) return '—';

  return new Date(dateString).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function getTodayInputValue() {
  return new Date().toISOString().split('T')[0];
}

export function getFutureInputValue(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'document';
}

export function buildDocumentFilename(invoice) {
  const number = slugify(invoice.number || invoice.type || 'document');
  const client = slugify(invoice.to?.name || 'client');
  return `${number}-${client}.pdf`;
}
