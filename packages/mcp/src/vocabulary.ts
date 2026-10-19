import type { DefaultFieldType, FieldValidation, GroupValidation, ShowCondition } from '@formhaus/core';

export const FIELD_TYPES = [
  'text',
  'email',
  'phone',
  'number',
  'password',
  'select',
  'autocomplete',
  'multiselect',
  'checkbox',
  'radio',
  'switch',
  'file',
  'date',
  'datetime',
  'time',
  'textarea',
  'hidden',
  'scale',
  'rating',
] as const satisfies readonly DefaultFieldType[];

export const OPTION_FIELD_TYPES = ['select', 'autocomplete', 'multiselect', 'radio'] as const satisfies readonly DefaultFieldType[];

export const SCALE_FIELD_TYPES = ['scale', 'rating'] as const satisfies readonly DefaultFieldType[];

export const IMAGE_FIELD_TYPES = ['radio', 'multiselect'] as const satisfies readonly DefaultFieldType[];

export const AUTO_ADVANCE_TYPES = ['radio', 'scale', 'rating'] as const satisfies readonly DefaultFieldType[];

export const SECTION_LAYOUTS = ['matrix'] as const;

export const CONDITION_OPERATORS = [
  'eq',
  'neq',
  'in',
  'notIn',
  'contains',
  'notContains',
  'notEmpty',
  'gt',
  'gte',
  'lt',
  'lte',
] as const satisfies readonly (keyof ShowCondition)[];

export const VALIDATION_RULES = [
  'required',
  'minLength',
  'maxLength',
  'min',
  'max',
  'pattern',
  'matchField',
  'validator',
] as const satisfies readonly (keyof FieldValidation)[];

export const ACTION_VARIANTS = ['primary', 'secondary', 'text'] as const;

export const CONTAINER_TYPES = ['section', 'group'] as const;

export const GROUP_RULES = ['required', 'minLength', 'maxLength', 'validator'] as const satisfies readonly (keyof GroupValidation)[];
