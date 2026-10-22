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

export function requireFormat(form: BuilderForm, version: `1.${number}`): void {
  const [major, minor = 0] = String(form.extra.formatVersion ?? '1.0')
    .split('.')
    .map(Number);
  if (major === 1 && minor < Number(version.slice(2))) form.extra.formatVersion = version;
}
