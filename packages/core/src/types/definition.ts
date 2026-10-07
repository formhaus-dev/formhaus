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
}
