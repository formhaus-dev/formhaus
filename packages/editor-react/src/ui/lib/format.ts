const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

const numberFormat = new Intl.NumberFormat('en-US');
const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

export function formatNumber(n: number): string {
  return numberFormat.format(n);
}

export function formatDay(iso: string): string {
  return dayFormat.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function formatUntil(iso: string, now: Date = new Date()): string {
  const left = new Date(iso).getTime() - now.getTime();
  if (left <= 0) return 'now';
  if (left >= day) {
    const days = Math.ceil(left / day);
    return `in ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (left >= hour) return `in ${Math.floor(left / hour)} h`;
  return `in ${Math.max(1, Math.floor(left / minute))} min`;
}

export function formatWhen(iso: string): string {
  const at = new Date(iso);
  return `${dateFormat.format(at)} · ${timeFormat.format(at)} UTC`;
}

export function formatAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const elapsed = now.getTime() - then.getTime();
  if (elapsed < minute) return 'just now';
  if (elapsed < hour) return `${Math.floor(elapsed / minute)} min ago`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)} h ago`;
  if (elapsed < 2 * day) return 'yesterday';
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)} days ago`;
  if (then.getUTCFullYear() === now.getUTCFullYear()) return dayFormat.format(then);
  return dateFormat.format(then);
}

export function initial(text: string): string {
  const first = Array.from(text.trim())[0];
  if (!first || !/[\p{L}\p{N}]/u.test(first)) return '?';
  return first.toUpperCase();
}
