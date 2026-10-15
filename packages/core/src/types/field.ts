import type { FieldI18n, GroupI18n, LabelI18n, StepI18n, ValidationI18n } from './i18n';

export type DefaultFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'password'
  | 'select'
  | 'autocomplete'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'file'
  | 'date'
  | 'datetime'
  | 'time'
  | 'textarea'
  | 'hidden';

export type FieldType = DefaultFieldType | (string & {});

export type FieldSourceName = 'referrer' | 'page' | 'pageTitle' | 'language' | 'timezone' | 'device' | 'country';

export type FieldSource = FieldSourceName | { query: string };

export interface FieldOption {
  value: string;
  label: string;
  i18n?: LabelI18n;
}

export interface FormField {
  key: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helperText?: string;
  autoAdvance?: boolean;
  defaultValue?: unknown;
  source?: FieldSource;
  show?: ShowCondition[];
  showAny?: ShowCondition[];
  validation?: FieldValidation;
  options?: FieldOption[];
  layout?: 'stack' | 'inline';
  optionsFrom?: string;
  optionsDependsOn?: string[];
  accept?: string;
  rows?: number;
  mask?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
  i18n?: FieldI18n;
}

export interface GroupValidation {
  required?: boolean | string;
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  validator?: string;
  i18n?: Pick<ValidationI18n, 'required' | 'minLength' | 'maxLength'>;
}

export interface FormGroup {
  key: string;
  type: 'group';
  label: string;
  helperText?: string;
  itemLabel?: string;
  addLabel?: string;
  removeLabel?: string;
  defaultItems?: number;
  show?: ShowCondition[];
  showAny?: ShowCondition[];
  validation?: GroupValidation;
  fields: FormField[];
  i18n?: GroupI18n;
}

export interface FormSection {
  key: string;
  type: 'section';
  title: string;
  description?: string;
  show?: ShowCondition[];
  showAny?: ShowCondition[];
  fields: (FormField | FormGroup)[];
  i18n?: StepI18n;
}

export type FormNode = FormField | FormSection | FormGroup;

export interface ShowCondition {
  field: string;
  eq?: string | number | boolean;
  neq?: string | number | boolean;
  in?: (string | number)[];
  notIn?: (string | number)[];
  notEmpty?: boolean;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
}

export interface FieldValidation {
  required?: boolean | string;
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  min?: number;
  minMessage?: string;
  max?: number;
  maxMessage?: string;
  pattern?: string;
  patternMessage?: string;
  matchField?: string;
  matchFieldMessage?: string;
  validator?: string;
  i18n?: ValidationI18n;
}
