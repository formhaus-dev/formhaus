import type { FormDefinition } from '@formhaus/core';
import { renderToStaticMarkup as staticMarkup } from '@formhaus/core/html';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';
import { choices as withFile, choiceValues, conditions, hidden, plain, questionTypes, questionValues } from './ssr.fixtures';

const choices: FormDefinition = { ...withFile, fields: withFile.fields!.filter((field) => 'type' in field && field.type !== 'file') };

const IGNORED = ['[data-fh="static"]', '.fh-field__option-zoom', 'dialog', '.fh-field__reveal'];
const ATTRIBUTES = [
  'class',
  'type',
  'name',
  'value',
  'checked',
  'selected',
  'hidden',
  'readonly',
  'aria-readonly',
  'multiple',
  'role',
  'rows',
];

function outline(element: Element): string {
  const attributes = ATTRIBUTES.filter((name) => element.hasAttribute(name))
    .map((name) => `${name}="${element.getAttribute(name)}"`)
    .join(' ');
  const children = [...element.childNodes].map((node) =>
    node.nodeType === 3 ? (node.textContent ?? '').trim() : outline(node as Element),
  );
  return `<${element.localName} ${attributes}>${children.filter(Boolean).join('')}</${element.localName}>`;
}

function normalized(markup: string): string {
  const root = new DOMParser().parseFromString(markup, 'text/html').body;
  for (const element of root.querySelectorAll(IGNORED.join(','))) element.remove();
  const form = root.querySelector('form')!;
  form.removeAttribute('method');
  form.removeAttribute('enctype');
  for (const control of form.querySelectorAll('button, input[type="checkbox"]')) control.removeAttribute('value');
  for (const button of form.querySelectorAll('button')) button.removeAttribute('name');
  return outline(form);
}

function both(definition: FormDefinition, values?: Record<string, unknown>, readOnly = false) {
  return {
    react: normalized(renderToStaticMarkup(<FormRenderer definition={definition} initialValues={values} readOnly={readOnly} />)),
    html: normalized(staticMarkup(definition, { values, readOnly })),
  };
}

const cases: [string, FormDefinition, Record<string, unknown> | undefined, boolean?][] = [
  ['plain fields', plain, { name: 'Ada', message: 'Hi' }],
  ['choice fields with values', choices, choiceValues],
  ['choice fields empty', choices, undefined],
  ['read-only choice fields', choices, choiceValues, true],
  ['read-only scales and ratings', questionTypes, questionValues, true],
  ['hidden fields', hidden, undefined],
  ['conditions on default values', conditions, undefined],
  ['conditions on given values', conditions, { kind: 'person' }],
  ['scales, ratings, images and matrix sections', questionTypes, questionValues],
];

describe('static markup matches the React renderer', () => {
  it.each(cases)('%s', (_, definition, values, readOnly) => {
    const { react, html } = both(definition, values, readOnly);
    expect(html).toBe(react);
  });
});
