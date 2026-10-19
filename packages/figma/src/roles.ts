import type { DefaultFieldType, FormField } from '@formhaus/core';
import type { TextSlot } from './config';

const FIELD_ROLES = [
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

type FieldRole = (typeof FIELD_ROLES)[number];
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

export type FieldDrawing = FieldRole | 'scale' | 'rating';

export const FIELD_DRAWINGS: Record<DefaultFieldType, FieldDrawing | null> = {
  text: 'field.text',
  email: 'field.text',
  phone: 'field.text',
  number: 'field.text',
  password: 'field.text',
  select: 'field.select',
  autocomplete: 'field.select',
  multiselect: 'option.checkbox',
  checkbox: 'field.checkbox',
  radio: 'option.radio',
  switch: 'field.switch',
  file: 'field.file',
  date: 'field.date',
  datetime: 'field.date',
  time: 'field.date',
  textarea: 'field.textarea',
  hidden: null,
  scale: 'scale',
  rating: 'rating',
};

export function drawingForField(field: Pick<FormField, 'type' | 'options'>): FieldDrawing | null {
  if (field.type === 'checkbox' && field.options?.length) return 'option.checkbox';
  return Object.prototype.hasOwnProperty.call(FIELD_DRAWINGS, field.type) ? FIELD_DRAWINGS[field.type as DefaultFieldType] : 'field.text';
}

export function isOptionRole(role: Role | FieldDrawing): role is 'option.radio' | 'option.checkbox' {
  return role === 'option.radio' || role === 'option.checkbox';
}
