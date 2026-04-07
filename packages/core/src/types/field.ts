export type DefaultFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'password'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'file'
  | 'date'
  | 'textarea';

export type FieldType = DefaultFieldType | (string & {});

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  key: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helperText?: string;
  defaultValue?: unknown;
  show?: ShowCondition[];
  showAny?: ShowCondition[];
  validation?: FieldValidation;
  options?: FieldOption[];
  optionsFrom?: string;
  optionsDependsOn?: string[];
  accept?: string;
  rows?: number;
  mask?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
}

export interface ShowCondition {
  field: string;
  eq?: string | number | boolean;
  neq?: string | number | boolean;
  in?: (string | number)[];
  notIn?: (string | number)[];
  notEmpty?: boolean;
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
}
