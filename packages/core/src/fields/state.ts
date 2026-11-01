import { fieldDomId } from '../internal/ids';
import type { FieldOption, FormField, FormGroup } from '../types';
import type { FreeText } from './text';
import { inputType } from './values';

export interface FieldStateInput {
  id?: string;
  field: FormField | FormGroup;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  readOnly?: boolean;
}

export interface FieldAria {
  'aria-invalid'?: true;
  'aria-required'?: true;
  'aria-readonly'?: true;
  'aria-describedby'?: string;
}

export interface ReadOnlyAttrs {
  readOnly?: true;
  role?: 'radiogroup';
  'aria-readonly'?: true;
}

export interface OptionAttrs {
  disabled: boolean;
  'aria-describedby'?: string;
}

export interface FieldState {
  id: string;
  name: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  inputMode?: FormField['inputMode'];
  inputType: string;
  error?: string;
  helperId: string;
  errorId: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  readOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  aria: FieldAria;
  optionId: (index: number) => string;
}

const COUNTED = ['text', 'email', 'phone', 'password', 'textarea'];
const TYPED = [...COUNTED, 'number', 'date', 'time', 'datetime', 'autocomplete'];

export const fieldId = ({ id, field }: Pick<FieldStateInput, 'id' | 'field'>): string => id ?? fieldDomId(undefined, field.key);

const RADIOS = ['radio', 'scale', 'rating'];

export function readOnlyAttrs({ field, readOnly }: Pick<FieldStateInput, 'field' | 'readOnly'>, group = false): ReadOnlyAttrs {
  if (!readOnly) return {};
  if (TYPED.includes(field.type)) return { readOnly: true };
  if (RADIOS.includes(field.type) !== group) return {};
  return group ? { role: 'radiogroup', 'aria-readonly': true } : { 'aria-readonly': true };
}

export const optionDescriptionId = (optionId: string): string => `${optionId}-description`;

export function optionAttrs(option: FieldOption, optionId: string, disabled?: boolean): OptionAttrs {
  return {
    disabled: !!disabled || option.disabled === true,
    'aria-describedby': option.description ? optionDescriptionId(optionId) : undefined,
  };
}

export function fieldAria({ id, field, error, readOnly }: FieldStateInput): FieldAria {
  const base = fieldId({ id, field });
  return {
    'aria-invalid': error ? true : undefined,
    'aria-required': field.validation?.required ? true : undefined,
    'aria-readonly': readOnly && !TYPED.includes(field.type) ? true : undefined,
    'aria-describedby': [field.helperText && `${base}-helper`, error && `${base}-error`].filter(Boolean).join(' ') || undefined,
  };
}

export function fieldState(input: FieldStateInput): FieldState {
  const { field, error } = input;
  const control = field as FormField;
  const id = fieldId(input);
  const aria = fieldAria(input);
  const counted = COUNTED.includes(field.type) ? control.validation : undefined;
  return {
    id,
    name: field.key,
    label: field.label,
    helperText: field.helperText,
    placeholder: control.placeholder ?? control.mask,
    inputMode: control.inputMode,
    inputType: inputType(field),
    error,
    helperId: `${id}-helper`,
    errorId: `${id}-error`,
    describedBy: aria['aria-describedby'],
    invalid: !!error,
    required: !!aria['aria-required'],
    disabled: !!(input.disabled || input.loading),
    readOnly: !!input.readOnly,
    minLength: counted?.minLength,
    maxLength: counted?.maxLength,
    aria,
    optionId: (index) => (index ? `${id}-${index}` : id),
  };
}

export interface FieldControl {
  id: string;
  name: string;
  disabled: boolean;
  readOnly?: true;
  placeholder?: string;
  inputMode?: FormField['inputMode'];
  onBlur: () => void;
  onFocus: () => void;
}

export interface FieldOptionAttrs extends OptionAttrs {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  'aria-readonly'?: true;
  'data-testid'?: string;
  onBlur: () => void;
  onFocus: () => void;
}

export interface FieldView<Attrs extends FieldControl> extends FieldState {
  value: unknown;
  text: string;
  loading?: boolean;
  freeText?: FreeText;
  testId?: string;
  options: FieldOption[];
  change: (value: unknown) => void;
  commit: (value: unknown) => void;
  blur: () => void;
  focus: () => void;
  attrs: Attrs & FieldAria & { 'data-testid'?: string };
  option: (option: FieldOption, index: number) => FieldOptionAttrs;
}

export function optionChecked(value: unknown, option: FieldOption): boolean {
  return Array.isArray(value) ? value.includes(option.value) : value != null && String(value) === option.value;
}

export const optionLocked = (option: FieldOption, value: unknown, readOnly?: boolean): boolean =>
  option.disabled === true || (!!readOnly && !optionChecked(value, option));
