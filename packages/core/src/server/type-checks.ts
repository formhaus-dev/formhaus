import type { FormField } from '../types';
import { getDefaultMessage, TYPE_MESSAGES } from '../validation/default-messages';
import { BOOLEAN_TYPES } from '../validation/validate-field';

export const MAX_STRING_LENGTH = 10000;
const MAX_EMAIL_LENGTH = 254;
const MAX_ITEMS = 1000;
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const DATE = '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])';
const DATE_ONLY = new RegExp(`^${DATE}$`);
const DATE_TIME = new RegExp(`^${DATE}T(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d{1,3})?)?(?:Z|[+-](?:[01]\\d|2[0-3]):[0-5]\\d)?$`);
const TEXT_TYPES = new Set(['text', 'phone', 'password', 'textarea', 'autocomplete']);
const FORMATS = new Map<string, [RegExp, string, number]>([
  ['email', [EMAIL, TYPE_MESSAGES.email, MAX_EMAIL_LENGTH]],
  ['date', [DATE_ONLY, TYPE_MESSAGES.date, MAX_STRING_LENGTH]],
  ['datetime', [DATE_TIME, TYPE_MESSAGES.datetime, MAX_STRING_LENGTH]],
]);

export function normalizeValue(field: FormField, value: unknown): unknown {
  if (field.type !== 'number' || typeof value !== 'string' || !DECIMAL.test(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function isOption(field: FormField, value: unknown): boolean {
  return !field.options || field.options.some((option) => option.value === value);
}

function lengthError(field: FormField, value: string): string | null {
  const max = Math.min(MAX_STRING_LENGTH, field.validation?.maxLength ?? MAX_STRING_LENGTH);
  if (value.length <= max) return null;
  return field.validation?.maxLengthMessage ?? getDefaultMessage('maxLength', { max });
}

function multiselectError(field: FormField, value: unknown): string | null {
  if (!Array.isArray(value)) return TYPE_MESSAGES.options;
  if (value.length > (field.options?.length ?? MAX_ITEMS)) return TYPE_MESSAGES.option;
  const valid = value.every((item) => typeof item === 'string' && item.length <= MAX_STRING_LENGTH && isOption(field, item));
  return valid ? null : TYPE_MESSAGES.option;
}

function stringError(field: FormField, value: unknown, message: string): string | null {
  return typeof value === 'string' ? lengthError(field, value) : message;
}

function formatError(field: FormField, value: unknown, [format, message, max]: [RegExp, string, number]): string | null {
  if (typeof value !== 'string') return message;
  return lengthError(field, value) ?? (value.length <= max && format.test(value) ? null : message);
}

function primitiveError(field: FormField, value: unknown): string | null {
  if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return null;
  return stringError(field, value, TYPE_MESSAGES.value);
}

function isBlank(field: FormField, value: unknown): boolean {
  return value == null || value === '' || (field.type === 'multiselect' && Array.isArray(value) && !value.length);
}

export function typeError(field: FormField, value: unknown): string | null {
  if (isBlank(field, value)) return null;
  if (BOOLEAN_TYPES.has(field.type)) return typeof value === 'boolean' ? null : TYPE_MESSAGES.boolean;
  if (field.type === 'number') return typeof value === 'number' && Number.isFinite(value) ? null : TYPE_MESSAGES.number;
  if (field.type === 'multiselect') return multiselectError(field, value);
  if (field.type === 'file') return stringError(field, value, TYPE_MESSAGES.file);
  const format = FORMATS.get(field.type);
  if (format) return formatError(field, value, format);
  if (field.type === 'select' || field.type === 'radio') return stringError(field, value, TYPE_MESSAGES.option) ?? (isOption(field, value) ? null : TYPE_MESSAGES.option);
  return TEXT_TYPES.has(field.type) ? stringError(field, value, TYPE_MESSAGES.string) : primitiveError(field, value);
}
