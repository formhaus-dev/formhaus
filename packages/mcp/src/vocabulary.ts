import type { DefaultFieldType, FieldValidation, ShowCondition } from '@formhaus/core';

export const FIELD_TYPES = [
  'text', 'email', 'phone', 'number', 'password', 'select', 'autocomplete', 'multiselect',
  'checkbox', 'radio', 'switch', 'file', 'date', 'datetime', 'textarea',
] as const satisfies readonly DefaultFieldType[];

export const OPTION_FIELD_TYPES = ['select', 'autocomplete', 'multiselect', 'radio'] as const satisfies readonly DefaultFieldType[];

export const CONDITION_OPERATORS = ['eq', 'neq', 'in', 'notIn', 'notEmpty'] as const satisfies readonly (keyof ShowCondition)[];

export const VALIDATION_RULES = [
  'required', 'minLength', 'maxLength', 'min', 'max', 'pattern', 'matchField', 'validator',
] as const satisfies readonly (keyof FieldValidation)[];

export const ACTION_VARIANTS = ['primary', 'secondary', 'text'] as const;
