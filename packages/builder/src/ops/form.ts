import type { FormAction } from '@formhaus/core';
import type { BuilderForm, FormExtra } from '../model';

export function setFormTitle(form: BuilderForm, title: string): void {
  form.title = title;
}

export function setSubmitLabel(form: BuilderForm, label: string): void {
  form.submit = label;
}

export function setFormProp<K extends Exclude<keyof FormExtra, 'submit'>>(
  form: BuilderForm,
  prop: K,
  value: FormExtra[K] | undefined,
): void {
  if (value === undefined || value === '') delete form.extra[prop];
  else form.extra[prop] = value;
}

export function setSubmitProp<K extends Exclude<keyof FormAction, 'label'>>(
  form: BuilderForm,
  prop: K,
  value: FormAction[K] | undefined,
): void {
  const submit = { ...form.extra.submit };
  if (value === undefined) delete submit[prop];
  else submit[prop] = value;
  if (Object.keys(submit).length) form.extra.submit = submit;
  else delete form.extra.submit;
}
