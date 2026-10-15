export type MessageKey =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'minItems'
  | 'maxItems'
  | 'min'
  | 'max'
  | 'pattern'
  | 'matchField'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime'
  | 'time'
  | 'option'
  | 'options'
  | 'boolean'
  | 'string'
  | 'file'
  | 'value'
  | 'hidden';

export type LabelKey =
  | 'continue'
  | 'back'
  | 'stepOf'
  | 'errorSummary'
  | 'addItem'
  | 'removeItem'
  | 'itemLabel'
  | 'itemAdded'
  | 'itemRemoved'
  | 'removeItemPrompt'
  | 'keepItem';

export type MessageCatalog = Partial<Record<MessageKey, string>>;
export type LabelCatalog = Partial<Record<LabelKey, string>>;

export interface FormI18n {
  title?: string;
  description?: string;
  messages?: MessageCatalog;
  labels?: LabelCatalog;
}

export interface StepI18n {
  title?: string;
  description?: string;
}

export interface FieldI18n {
  label?: string;
  placeholder?: string;
  helperText?: string;
}

export interface GroupI18n {
  label?: string;
  helperText?: string;
  itemLabel?: string;
  addLabel?: string;
  removeLabel?: string;
}

export interface LabelI18n {
  label?: string;
}

export interface ValidationI18n {
  required?: string;
  minLength?: string;
  maxLength?: string;
  min?: string;
  max?: string;
  pattern?: string;
  matchField?: string;
}

export type LabelFn = (key: LabelKey, params: Record<string, unknown>) => string | undefined;
export type LabelSource = LabelCatalog | LabelFn;
