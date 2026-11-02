import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '../../src';
import { renderToStaticMarkup } from '../../src/html';
import { research } from '../../src/research';
import { form } from './fixtures';

describe('errors', () => {
  const definition = form([
    { key: 'a', type: 'text', label: 'A' },
    { key: 'b', type: 'text', label: 'B' },
  ]);

  it('places a field error under the field and links it from the summary', () => {
    const markup = renderToStaticMarkup(definition, { errors: { a: 'Too short' } });
    expect(markup).toContain('<p id="fh-a-error" class="fh-field__error" role="alert">Too short</p>');
    expect(markup).toContain('aria-invalid="true" aria-describedby="fh-a-error"');
    expect(markup).toContain('<a class="fh-error-summary__link" href="#fh-a">A: Too short</a>');
    expect(markup.indexOf('fh-field__error')).toBeLessThan(markup.indexOf('fh-error-summary'));
  });

  it('puts form errors above the actions, after the fields', () => {
    const markup = renderToStaticMarkup(definition, { formErrors: ['Try again later'] });
    const at = (text: string) => markup.indexOf(text);
    expect(at('fh-form__fields')).toBeLessThan(at('fh-form__top-error'));
    expect(at('fh-form__top-error')).toBeLessThan(at('fh-form-actions'));
    expect(markup).toContain('<p class="fh-form__top-error">Try again later</p>');
  });

  it('puts the summary above the fields on request, or leaves it out', () => {
    const top = renderToStaticMarkup(definition, { errors: { a: 'x' }, errorSummary: 'top' });
    expect(top.indexOf('fh-error-summary')).toBeLessThan(top.indexOf('fh-form__fields'));
    expect(renderToStaticMarkup(definition, { errors: { a: 'x' }, errorSummary: false })).not.toContain('fh-error-summary');
    expect(renderToStaticMarkup(definition)).not.toContain('fh-error-summary');
  });
});

describe('text', () => {
  it('uses labels for built-in words', () => {
    const markup = renderToStaticMarkup(form([{ key: 'a', type: 'text', label: 'A', validation: { required: true } }]), {
      errors: { a: 'Needed' },
      labels: { errorSummary: 'Bitte prüfen', required: 'Pflicht' } as never,
    });
    expect(markup).toContain('Bitte prüfen');
    expect(markup).not.toContain('Check these answers');
  });

  it('fills answers into later texts', () => {
    const recall: FormDefinition = {
      formatVersion: '1.8',
      id: 'f',
      title: 'T',
      submit: { label: 'Send' },
      fields: [
        { key: 'name', type: 'text', label: 'Name' },
        { key: 'hi', type: 'text', label: 'Hello {{name}}' },
      ],
    };
    expect(renderToStaticMarkup(recall, { values: { name: 'Ada' } })).toContain('Hello Ada');
  });

  it('orders randomized options by seed', () => {
    const field = {
      key: 'r',
      type: 'radio',
      label: 'R',
      randomize: true,
      options: ['a', 'b', 'c', 'd', 'e', 'f'].map((value) => ({ value, label: value })),
    } as const;
    const definition = form([field]);
    const order = (seed: string) =>
      [...renderToStaticMarkup(definition, { seed, research }).matchAll(/class="fh-field__radio" value="(\w)"/g)].map(([, value]) => value);
    expect(order('one')).toEqual(order('one'));
    expect(order('one').sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(new Set(['one', 'two', 'three', 'four'].map((seed) => order(seed).join(''))).size).toBeGreaterThan(1);
  });
});
