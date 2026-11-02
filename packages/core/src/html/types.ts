import type { FormEngineOptions } from '../engine';
import type { FieldOption, LabelKey, LabelSource } from '../types';

export type StaticLabel = (key: LabelKey, params?: Record<string, unknown>) => string;

export interface StaticAction {
  label: string;
  name: string;
  value: string;
  novalidate?: boolean;
}

export interface StaticMarkupOptions
  extends Pick<FormEngineOptions, 'locale' | 'messages' | 'lang' | 'seed' | 'research' | 'hiddenValues'> {
  values?: Record<string, unknown>;
  errors?: Record<string, string>;
  formErrors?: readonly string[];
  action?: string;
  method?: 'post' | 'get';
  id?: string;
  className?: string;
  hiddenInputs?: Record<string, string>;
  labels?: LabelSource;
  options?: Record<string, FieldOption[]>;
  readOnly?: boolean;
  errorSummary?: boolean | 'top' | 'bottom';
  novalidate?: boolean;
  autofocus?: string;
  secondaryActions?: readonly StaticAction[];
}
