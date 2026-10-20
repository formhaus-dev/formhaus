import { describe, expect, it } from 'vitest';
import { checkDefinition, type FormDefinition } from '../../src';
import { translationIssues } from '../../src/i18n';

const steps = (formatVersion: string, texts: Record<string, string>): FormDefinition => ({
  formatVersion,
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'one',
      title: texts.title ?? 'One',
      fields: [
        { key: 'name', type: 'text', label: texts.label ?? 'Name' },
        { key: 'people', type: 'group', label: 'People', fields: [{ key: 'first', type: 'text', label: texts.item ?? 'First' }] },
      ],
    },
    { id: 'two', title: 'Two', description: texts.description, fields: [{ key: 'email', type: 'email', label: 'Email' }] },
  ],
});

const warnings = (input: FormDefinition) =>
  checkDefinition(input)
    .filter(({ severity }) => severity === 'warning')
    .map(({ code, path }) => ({ code, path }));

describe('recall checks', () => {
  it('accepts earlier fields, the same step and item fields', () => {
    expect(warnings(steps('1.5', { description: '{{name}} {{ people }}', item: '{{name}}' }))).toEqual([]);
  });

  it('warns about unknown keys', () => {
    expect(warnings(steps('1.5', { title: 'Hi {{nmae}}', item: '{{email}} {{name}}' }))).toEqual([
      { code: 'unknown-recall-field', path: '/steps/0/title' },
      { code: 'recall-forward-reference', path: '/steps/0/fields/1/fields/0/label' },
    ]);
  });

  it('warns about later steps and the same field', () => {
    expect(warnings(steps('1.5', { label: 'Name {{name}}', title: '{{email}}' }))).toEqual([
      { code: 'recall-forward-reference', path: '/steps/0/title' },
      { code: 'recall-forward-reference', path: '/steps/0/fields/0/label' },
    ]);
  });

  it('warns about reserved token content and checks item labels in the item', () => {
    const input = steps('1.5', { title: 'Hi {{name|upper}} \\{{x}}' });
    input.steps![0].fields.push({
      key: 'kids',
      type: 'group',
      label: 'Kids',
      itemLabel: 'Kid {{kid}} of {{name}} {{nope}}',
      fields: [{ key: 'kid', type: 'text', label: 'Kid' }],
    });
    expect(warnings(input)).toEqual([
      { code: 'recall-syntax', path: '/steps/0/title' },
      { code: 'unknown-recall-field', path: '/steps/0/fields/2/itemLabel' },
    ]);
  });

  it('warns once per text and code', () => {
    expect(warnings(steps('1.5', { title: '{{a}} {{b}} {{x|y}} {{x|z}} {{email}} {{email}}' }))).toEqual([
      { code: 'recall-syntax', path: '/steps/0/title' },
      { code: 'unknown-recall-field', path: '/steps/0/title' },
      { code: 'recall-forward-reference', path: '/steps/0/title' },
    ]);
  });

  it('warns about recalled passwords, query sources and page sources', () => {
    const input = steps('1.5', { description: '{{pw}} {{utm}} {{ref}}' });
    input.steps![0].fields.push(
      { key: 'pw', type: 'password', label: 'Password' },
      { key: 'utm', type: 'hidden', source: { query: 'utm' } },
      { key: 'ref', type: 'hidden', source: 'referrer' },
    );
    expect(warnings(input)).toEqual([
      { code: 'recall-sensitive-field', path: '/steps/1/description' },
      { code: 'recall-query-source', path: '/steps/1/description' },
      { code: 'recall-untrusted-source', path: '/steps/1/description' },
    ]);
  });

  it('warns about a recalled page title and not about other sources', () => {
    const input = steps('1.5', { description: '{{title}}' });
    input.steps![0].fields.push({ key: 'title', type: 'hidden', source: 'pageTitle' });
    expect(warnings(input)).toEqual([{ code: 'recall-untrusted-source', path: '/steps/1/description' }]);
    const safe = steps('1.5', { description: '{{lang}} {{zone}}' });
    safe.steps![0].fields.push({ key: 'lang', type: 'hidden', source: 'language' }, { key: 'zone', type: 'hidden', source: 'timezone' });
    expect(warnings(safe)).toEqual([]);
  });

  it('asks for format 1.5 when a text recalls an answer', () => {
    expect(warnings(steps('1.4', { description: '{{name}}' }))).toEqual([{ code: 'outdated-format-version', path: '/formatVersion' }]);
    expect(checkDefinition(steps('1.4', { description: '{{name}}' }))[0].message).toContain('needs format 1.5');
  });

  it('compares escapes and reserved tokens in translations', () => {
    const source = steps('1.5', { description: 'Thanks {{name}} \\{{x}}' });
    const issues = (description: string) => translationIssues(source, { steps: { two: { description } } }).placeholderMismatch;
    expect(issues('Danke {{ name }}')).toEqual([]);
    expect(issues('Danke {{name}} {{name|upper}}')).toEqual(['steps.two.description']);
    expect(issues('Danke \\{{name}}')).toEqual(['steps.two.description']);
  });

  it('reports a translation that drops or adds a recall token', () => {
    const source = steps('1.5', { description: 'Thanks {{name}}' });
    expect(translationIssues(source, { steps: { two: { description: 'Danke' } } }).placeholderMismatch).toEqual(['steps.two.description']);
    expect(translationIssues(source, { steps: { two: { description: 'Danke {{ name }}' } } }).placeholderMismatch).toEqual([]);
    expect(translationIssues(source, { steps: { one: { title: 'Eins {{name}}' } } }).placeholderMismatch).toEqual(['steps.one.title']);
    expect(translationIssues(source, { steps: { two: { description: 'Danke {name}' } } }).placeholderMismatch).toEqual([
      'steps.two.description',
    ]);
  });
});
