import type { FormField } from '../types';
import { matchesFormat, NUMBER_TYPES } from '../validation/type-checks';

export type RecallFormatFn = (value: string | number | string[], field: FormField, locale: string) => string;

const STAMP_TYPES = ['date', 'time', 'datetime'];
const CACHE_SIZE = 32;
const formatters = new Map<string, unknown>();

export function supported(locale: string): string {
  try {
    const [tag] = Intl.getCanonicalLocales(locale);
    return Intl.DateTimeFormat.supportedLocalesOf(tag)[0] ? tag : 'en';
  } catch {
    return 'en';
  }
}

export function formatter<T>(kind: string, locale: string, create: () => T): T {
  const key = `${kind} ${locale}`;
  const cached = formatters.get(key) ?? create();
  formatters.delete(key);
  formatters.set(key, cached);
  if (formatters.size > CACHE_SIZE) formatters.delete(formatters.keys().next().value!);
  return cached as T;
}

export const numberFormat = (locale: string) =>
  formatter('number', locale, () => new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }));

function stamp(type: string, value: string): Date {
  const parts = value.match(/\d+/g)!.map(Number);
  const [year, month, day, hours = 0, minutes = 0] = type === 'time' ? [1970, 1, 1, ...parts] : parts;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hours, minutes);
  return date;
}

function localized(value: string | number | string[], type: string, locale: string): string | undefined {
  if (Array.isArray(value)) return formatter('list', locale, () => new Intl.ListFormat(locale, { type: 'conjunction' })).format(value);
  if (typeof value === 'number')
    return [...NUMBER_TYPES, 'group'].includes(type) && !String(value).includes('e') ? numberFormat(locale).format(value + 0) : undefined;
  if (!STAMP_TYPES.includes(type) || !matchesFormat(type, value)) return undefined;
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: type === 'time' ? undefined : 'medium',
    timeStyle: type === 'date' ? undefined : 'short',
    timeZone: 'UTC',
  };
  return formatter(type, locale, () => new Intl.DateTimeFormat(locale, options)).format(stamp(type, value));
}

export const asStored: RecallFormatFn = (value) => (Array.isArray(value) ? value.join(', ') : String(value));

const collapse = (text: string) => text.replace(/\s+/g, ' ');

export const formatRecallValue: RecallFormatFn = (value, field, locale) => {
  const answer = typeof value === 'number' ? value : Array.isArray(value) ? value.map(collapse) : collapse(value);
  try {
    const text = localized(answer, field.type, supported(locale));
    if (text !== undefined) return text;
  } catch {}
  return asStored(answer, field, locale);
};
