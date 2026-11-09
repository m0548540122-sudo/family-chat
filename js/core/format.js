// Pure formatting helpers: no DOM, no network.
const AVATAR_COLORS = ['#BF4A27', '#4F7350', '#8A5A2B', '#7A4B8C', '#2F6F7E', '#B5475F'];

export function colorFor(id = '') {
  let sum = 0;
  for (const ch of id) sum = (sum * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export const initial = (name = '') => name.trim().charAt(0) || '?';

export const time = (iso) =>
  new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export function dayLabel(iso, now = new Date()) {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return 'היום';
  if (date.toDateString() === yesterday.toDateString()) return 'אתמול';
  return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function shortWhen(iso, now = new Date()) {
  if (!iso) return '';
  return sameDay(iso, now) ? time(iso) : dayLabel(iso, now);
}

export function fileSize(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} ק״ב`;
  return `${(bytes / 1024 / 1024).toFixed(1)} מ״ב`;
}

export function splitLinks(text) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((value, index) => ({ value, link: index % 2 === 1 }));
}

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const isPhoto = (type = '') => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type);
