export type DateType = 'date' | 'datetime' | 'time';

const pad = (part: number) => String(part).padStart(2, '0');
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const TIME = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function fromDate(date: Date | null | undefined, type: DateType = 'date'): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return type === 'time' ? time : type === 'datetime' ? `${day}T${time}` : day;
}

export function toDate(value: unknown): Date | null {
  const text = typeof value === 'string' ? value : '';
  const time = TIME.exec(text);
  const parts = time ? ['1970', '01', '01', ...time.slice(1)] : DATE_TIME.exec(text)?.slice(1);
  if (!parts) return null;
  const [year, month, day, hours, minutes, seconds] = parts.slice(0, 6).map((part) => Number(part ?? 0));
  const millis = Number((parts[6] ?? '').padEnd(3, '0'));
  const zone = parts[7];
  const utc = Date.UTC(year, month - 1, day, hours, minutes, seconds, millis);
  const check = new Date(utc);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hours > 23 || minutes > 59 || seconds > 59) return null;
  if (!zone) return new Date(year, month - 1, day, hours, minutes, seconds, millis);
  const offset = zone === 'Z' ? 0 : (zone[0] === '-' ? -1 : 1) * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4)));
  return new Date(utc - offset * 60000);
}
