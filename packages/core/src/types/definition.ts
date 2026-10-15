import type { FormAction } from './action';
import type { FormField, ShowCondition } from './field';
import type { FormI18n, LabelCatalog, MessageCatalog, StepI18n } from './i18n';

export interface FormDefinition {
  $schema?: string;
  formatVersion?: string;
  id: string;
  lang?: string;
  title: string;
  description?: string;
  messages?: MessageCatalog;
  labels?: LabelCatalog;
  i18n?: FormI18n;
  submit: FormAction;
  cancel?: FormAction;
  fields?: FormField[];
  steps?: FormStep[];
}

export interface StepRoute {
  to: string | null;
  show?: ShowCondition[];
  showAny?: ShowCondition[];
}

export interface FormStep {
  routes?: StepRoute[];
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  show?: ShowCondition[];
  showAny?: ShowCondition[];
  next?: FormAction | false;
  back?: FormAction | false;
  skip?: FormAction;
  i18n?: StepI18n;
}
