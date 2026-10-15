import type { FormField } from '../types';
import { type MessageKey, messageResolver, type ResolveMessage } from './default-messages';

export const BOOLEAN_TYPES = ['checkbox', 'switch'];
export const BUILT_IN_TYPES = ['text', 'email', 'phone', 'number', 'password', 'select', 'autocomplete', 'multiselect', 'checkbox', 'radio', 'switch', 'file', 'date', 'datetime', 'time', 'textarea', 'hidden'];

export const MAX_STRING_LENGTH = 10000;
const MAX_EMAIL_LENGTH = 254;
const MAX_ITEMS = 1000;
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const DATE = '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])';
const DATE_ONLY = new RegExp(`^${DATE}$`);
const HOURS = '(?:[01]\\d|2[0-3]):[0-5]\\d';
const DATE_TIME = new RegExp(`^${DATE}T${HOURS}(?::[0-5]\\d(?:\\.\\d{1,3})?)?(?:Z|[+-]${HOURS})?$`);
const TIME = new RegExp(`^${HOURS}(?::[0-5]\\d)?$`);
const TEXT_TYPES = new Set(['text', 'phone', 'password', 'textarea', 'autocomplete', 'hidden']);
const FORMATS = new Map<string, [RegExp, MessageKey, number]>([
  ['email', [EMAIL, 'email', MAX_EMAIL_LENGTH]],
  ['date', [DATE_ONLY, 'date', MAX_STRING_LENGTH]],
  ['datetime', [DATE_TIME, 'datetime', MAX_STRING_LENGTH]],
  ['time', [TIME, 'time', MAX_STRING_LENGTH]],
]);

type Fail = (key: MessageKey, params?: Record<string, unknown>) => string;

function isCalendarDate(value: string): boolean {
  const [year, month, day] = value.split(/\D/).map(Number);
  return day <= new Date(new Date(0).setUTCFullYear(year, month, 0)).getUTCDate();
}

const UNTRIMMED_TYPES = new Set(['password', 'number', 'select', 'radio', 'file']);

export function trimValue(field: FormField, value: unknown): unknown {
  return typeof value === 'string' && !UNTRIMMED_TYPES.has(field.type) ? value.trim() : value;
}

export function normalizeValue(field: FormField, input: unknown): unknown {
  if (Array.isArray(input) && input.length === 0 && field.type !== 'multiselect' && BUILT_IN_TYPES.includes(field.type)) return undefined;
  const value = trimValue(field, input);
  if (field.type !== 'number' || typeof value !== 'string' || !DECIMAL.test(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

const staticOptions = (field: FormField) => (field.optionsFrom ? undefined : field.options);

function isOption(field: FormField, value: unknown): boolean {
  const options = staticOptions(field);
  return !options || options.some((option) => option.value === value);
}

function lengthError(field: FormField, value: string, fail: Fail): string | null {
  const max = Math.min(MAX_STRING_LENGTH, field.validation?.maxLength ?? MAX_STRING_LENGTH);
  if (value.length <= max) return null;
  return field.validation?.maxLengthMessage ?? fail('maxLength', { max });
}

function multiselectError(field: FormField, value: unknown, fail: Fail): string | null {
  if (!Array.isArray(value)) return fail('options');
  if (value.length > (staticOptions(field)?.length ?? MAX_ITEMS)) return fail('option');
  const valid = value.every((item) => typeof item === 'string' && item.length <= MAX_STRING_LENGTH && isOption(field, item));
  return valid ? null : fail('option');
}

function stringError(field: FormField, value: unknown, key: MessageKey, fail: Fail): string | null {
  return typeof value === 'string' ? lengthError(field, value, fail) : fail(key);
}

function formatError(field: FormField, value: unknown, [format, key, max]: [RegExp, MessageKey, number], fail: Fail): string | null {
  if (typeof value !== 'string') return fail(key);
  return lengthError(field, value, fail) ?? (value.length <= max && format.test(value) && (format === EMAIL || format === TIME || isCalendarDate(value)) ? null : fail(key));
}

function primitiveError(field: FormField, value: unknown, fail: Fail): string | null {
  if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return null;
  return stringError(field, value, 'value', fail);
}

function isBlank(field: FormField, value: unknown): boolean {
  return value == null || value === '' || (field.type === 'multiselect' && Array.isArray(value) && !value.length);
}

export function typeError(field: FormField, value: unknown, resolve: ResolveMessage = messageResolver()): string | null {
  if (isBlank(field, value)) return null;
  const fail: Fail = (key, params = {}) => resolve(key, params, field);
  if (BOOLEAN_TYPES.includes(field.type)) return typeof value === 'boolean' ? null : fail('boolean');
  if (field.type === 'number') return typeof value === 'number' && Number.isFinite(value) ? null : fail('number');
  if (field.type === 'multiselect') return multiselectError(field, value, fail);
  if (field.type === 'file') return stringError(field, value, 'file', fail);
  const format = FORMATS.get(field.type);
  if (format) return formatError(field, value, format, fail);
  if (field.type === 'select' || field.type === 'radio') return stringError(field, value, 'option', fail) ?? (isOption(field, value) ? null : fail('option'));
  return TEXT_TYPES.has(field.type) ? stringError(field, value, 'string', fail) : primitiveError(field, value, fail);
}

export function typeMessageKeys(field: FormField): MessageKey[] {
  if (BOOLEAN_TYPES.includes(field.type)) return ['boolean'];
  if (field.type === 'number') return ['number'];
  if (field.type === 'multiselect') return ['options', 'option'];
  const format = FORMATS.get(field.type)?.[1];
  if (format) return [format, 'maxLength'];
  if (field.type === 'file') return ['file', 'maxLength'];
  if (field.type === 'select' || field.type === 'radio') return ['option', 'maxLength'];
  return [TEXT_TYPES.has(field.type) ? 'string' : 'value', 'maxLength', ...(field.type === 'hidden' ? ['hidden' as const] : [])];
}

export function clientTypeError(field: FormField, value: unknown, resolve?: ResolveMessage): string | null {
  if (field.type === 'file' || !BUILT_IN_TYPES.includes(field.type)) return null;
  return typeError(field, value, resolve);
}
