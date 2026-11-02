import type { FormDefinition } from '@formhaus/core';
import { parseFormData, renderToStaticMarkup, type StaticAction, type StaticMarkupOptions } from '@formhaus/core/html';

const definition: FormDefinition = {
  id: 'code',
  title: 'Code',
  fields: [{ key: 'code', type: 'text', label: 'Code' }],
  submit: { label: 'Allow' },
};
const cancel: StaticAction = { label: 'Cancel', name: 'decision', value: 'deny', novalidate: true };
const options: StaticMarkupOptions = { autofocus: 'code', secondaryActions: [cancel], hiddenInputs: { csrf: 'token' } };

export const markup: string = renderToStaticMarkup(definition, { autofocus: 'code', secondaryActions: [cancel] });
export const withOptions: string = renderToStaticMarkup(definition, options);
export const values = parseFormData(definition, { code: '1' });
