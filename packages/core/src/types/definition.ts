import type { FormAction } from './action';
import type { FormField, ShowCondition } from './field';

export interface FormDefinition {
  id: string;
  title: string;
  submit: FormAction;
  cancel?: FormAction;
  fields?: FormField[];
  steps?: FormStep[];
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  show?: ShowCondition[];
  showAny?: ShowCondition[];
  next?: FormAction;
  back?: FormAction | false;
}
