export function formatDateTime(value) {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatCompactDate(value) {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

export function splitFilterInput(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function localizeErrorMessage(message) {
  const raw = String(message || '').trim();
  if (!raw) return 'Terjadi kesalahan. Silakan coba lagi.';

  const lowered = raw.toLowerCase();
  if (lowered.includes('unauthorized')) return 'Sesi admin tidak valid. Silakan login ulang.';
  if (lowered.includes('forbidden')) return 'Akses ditolak untuk aksi ini.';
  if (lowered.includes('domain not allowed')) return 'Domain belum diizinkan.';
  if (lowered.includes('invalid')) return 'Data tidak valid. Periksa kembali input Anda.';
  if (lowered.includes('failed to load')) return 'Gagal memuat data. Coba lagi beberapa saat.';
  if (lowered.includes('request failed')) return 'Permintaan gagal diproses oleh server.';
  return raw;
}

export function hasActiveFilterConfig(config = {}) {
  return Boolean(
    (config.subjectExact && config.subjectExact.length) ||
    (config.subjectIncludes && config.subjectIncludes.length) ||
    (config.subjectExcludes && config.subjectExcludes.length) ||
    (config.senderIncludes && config.senderIncludes.length) ||
    (config.keywordIncludes && config.keywordIncludes.length) ||
    config.customRegex
  );
}

export function hasAliasConfig(row) {
  return hasActiveFilterConfig(row?.filterConfig || {}) || Boolean(row?.pinHash);
}

export function paginateRows(rows, page, pageSize) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    total,
    totalPages,
    page: safePage,
    rows: rows.slice(start, start + pageSize)
  };
}

export const ADMIN_NAV_ITEMS = [
  { key: 'overview', icon: 'bi-speedometer2', label: 'Ringkasan' },
  { key: 'aliases', icon: 'bi-at', label: 'Alias' },
  { key: 'inbox', icon: 'bi-inboxes', label: 'Kotak Masuk' },
  { key: 'logs', icon: 'bi-envelope-paper', label: 'Log Email' },
  { key: 'domains', icon: 'bi-globe2', label: 'Domain' },
  { key: 'api-keys', icon: 'bi-key', label: 'API Key' },
  { key: 'security', icon: 'bi-shield-lock', label: 'Keamanan' },
  { key: 'tampilan', icon: 'bi-palette', label: 'Tampilan' }
];

export const ADMIN_THEMES = [
  { id: 'blue', name: 'Ocean Blue', swatches: ['#667eea', '#764ba2'] },
  { id: 'dark', name: 'Midnight Dark', swatches: ['#1e293b', '#6366f1'] },
  { id: 'green', name: 'Forest Green', swatches: ['#10b981', '#0d9488'] },
  { id: 'rose', name: 'Cherry Rose', swatches: ['#f43f5e', '#a855f7'] },
  { id: 'amber', name: 'Sunset Amber', swatches: ['#f59e0b', '#f97316'] }
];

export const ADMIN_THEME_MAP = {
  blue: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', pageBg: '#f1f5f9', cardBg: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', primary: '#6366f1', shadow: '0 10px 30px rgba(102,126,234,0.18)' },
  dark: { gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', pageBg: '#0b1220', cardBg: '#1f2a44', border: '#2b3a55', text: '#f8fafc', muted: '#cbd5f1', primary: '#a5b4fc', shadow: '0 10px 30px rgba(0,0,0,0.45)' },
  green: { gradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)', pageBg: '#ecfdf5', cardBg: '#ffffff', border: '#d1fae5', text: '#064e3b', muted: '#6b7280', primary: '#10b981', shadow: '0 10px 30px rgba(16,185,129,0.16)' },
  rose: { gradient: 'linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)', pageBg: '#fff1f2', cardBg: '#ffffff', border: '#fecdd3', text: '#881337', muted: '#6b7280', primary: '#f43f5e', shadow: '0 10px 30px rgba(244,63,94,0.16)' },
  amber: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', pageBg: '#fffbeb', cardBg: '#ffffff', border: '#fde68a', text: '#78350f', muted: '#6b7280', primary: '#f59e0b', shadow: '0 10px 30px rgba(245,158,11,0.16)' }
};
