const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

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
