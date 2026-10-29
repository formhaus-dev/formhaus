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
}

export interface FieldAria {
  'aria-invalid'?: true;
  'aria-required'?: true;
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
  minLength?: number;
  maxLength?: number;
  aria: FieldAria;
  optionId: (index: number) => string;
}

const COUNTED = ['text', 'email', 'phone', 'password', 'textarea'];

export const fieldId = ({ id, field }: Pick<FieldStateInput, 'id' | 'field'>): string => id ?? fieldDomId(undefined, field.key);

export function fieldAria({ id, field, error }: FieldStateInput): FieldAria {
  const base = fieldId({ id, field });
  return {
    'aria-invalid': error ? true : undefined,
    'aria-required': field.validation?.required ? true : undefined,
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
  placeholder?: string;
  inputMode?: FormField['inputMode'];
  onBlur: () => void;
  onFocus: () => void;
}

export interface FieldOptionAttrs {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  disabled: boolean;
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
