import type { FormDefinition } from '../../src';

export const form = (fields: FormDefinition['fields'], extra: Partial<FormDefinition> = {}): FormDefinition => ({
  formatVersion: '1.8',
  id: 'f',
  title: 'T',
  submit: { label: 'Send' },
  fields,
  ...extra,
});
