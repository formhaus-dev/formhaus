import type { FieldValidation } from '@formhaus/core';
import type { BuilderForm } from '../model';
import { findField } from './locate';

export type RuleName = Exclude<keyof FieldValidation, 'required' | 'i18n'>;

export function setRule<K extends RuleName>(form: BuilderForm, uid: string, rule: K, value: FieldValidation[K] | undefined): void {
  const question = findField(form, uid);
  if (!question) return;
  const rules: FieldValidation = { ...question.extra.validation };
  if (value === undefined || value === '') delete rules[rule];
  else rules[rule] = value;
  if (Object.keys(rules).length) question.extra.validation = rules;
  else delete question.extra.validation;
}
