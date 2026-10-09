import type { FormField } from '@formhaus/core';
import type { TextSlot } from './config';

export const FIELD_ROLES = [
  'field.text',
  'field.select',
  'field.textarea',
  'field.date',
  'field.file',
  'field.checkbox',
  'field.switch',
  'option.radio',
  'option.checkbox',
] as const;

export const BUTTON_ROLES = ['button.primary', 'button.secondary', 'button.text'] as const;

export type ButtonKind = 'primary' | 'secondary' | 'text';

export type FieldRole = (typeof FIELD_ROLES)[number];
export type ButtonRole = (typeof BUTTON_ROLES)[number];
export type Role = FieldRole | ButtonRole;

export const ROLES: readonly Role[] = [...FIELD_ROLES, ...BUTTON_ROLES];

const INPUT_SLOTS: TextSlot[] = ['label', 'value', 'helper'];
const CONTROL_SLOTS: TextSlot[] = ['label', 'helper'];
const LABEL_ONLY: TextSlot[] = ['label'];

export const ROLE_SLOTS: Record<Role, TextSlot[]> = {
  'field.text': INPUT_SLOTS,
  'field.select': INPUT_SLOTS,
  'field.textarea': INPUT_SLOTS,
  'field.date': INPUT_SLOTS,
  'field.file': INPUT_SLOTS,
  'field.checkbox': CONTROL_SLOTS,
  'field.switch': CONTROL_SLOTS,
  'option.radio': LABEL_ONLY,
  'option.checkbox': LABEL_ONLY,
  'button.primary': LABEL_ONLY,
  'button.secondary': LABEL_ONLY,
  'button.text': LABEL_ONLY,
};

export const ROLE_FALLBACKS: Partial<Record<Role, Role[]>> = {
  'field.select': ['field.text'],
  'field.date': ['field.select', 'field.text'],
  'field.file': ['field.text'],
  'field.textarea': ['field.text'],
  'field.checkbox': ['option.checkbox'],
  'field.switch': ['field.checkbox', 'option.checkbox'],
  'option.checkbox': ['field.checkbox'],
  'button.secondary': ['button.text'],
  'button.text': ['button.primary'],
};

export const ROLE_LABELS: Record<Role, string> = {
  'field.text': 'Text input',
  'field.select': 'Select',
  'field.textarea': 'Text area',
  'field.date': 'Date',
  'field.file': 'File upload',
  'field.checkbox': 'Checkbox',
  'field.switch': 'Switch',
  'option.radio': 'Radio option',
  'option.checkbox': 'Checkbox option',
  'button.primary': 'Primary button',
  'button.secondary': 'Secondary button',
  'button.text': 'Text button',
};

const ROLE_BY_TYPE: Record<string, FieldRole> = {
  select: 'field.select',
  autocomplete: 'field.select',
  textarea: 'field.textarea',
  date: 'field.date',
  datetime: 'field.date',
  file: 'field.file',
  switch: 'field.switch',
  radio: 'option.radio',
  multiselect: 'option.checkbox',
};

export function roleForField(field: FormField): FieldRole {
  if (field.type === 'checkbox') return field.options?.length ? 'option.checkbox' : 'field.checkbox';
  return ROLE_BY_TYPE[field.type] ?? 'field.text';
}

export function isOptionRole(role: Role): role is 'option.radio' | 'option.checkbox' {
  return role === 'option.radio' || role === 'option.checkbox';
}
