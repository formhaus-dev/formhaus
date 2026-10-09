import type { FormField } from '@formhaus/core';

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

export const BUTTON_ROLES = ['button.primary', 'button.secondary'] as const;

export type FieldRole = (typeof FIELD_ROLES)[number];
export type ButtonRole = (typeof BUTTON_ROLES)[number];
export type Role = FieldRole | ButtonRole;

export const ROLES: readonly Role[] = [...FIELD_ROLES, ...BUTTON_ROLES];

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
