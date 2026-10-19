import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine, recallText, type FormDefinition } from '../../src';
import { translationIssues } from '../../src/i18n';

const definition = (formatVersion = '1.5'): FormDefinition => ({
  formatVersion,
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    {
      key: 'plan',
      type: 'radio',
      label: 'Plan',
      options: [
        { value: 'pro', label: 'Pro' },
        { value: 'team', label: 'Team' },
      ],
    },
    {
      key: 'tags',
      type: 'multiselect',
      label: 'Tags',
      options: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
      ],
    },
    { key: 'agree', type: 'checkbox', label: 'I agree' },
    { key: 'seats', type: 'number', label: 'Seats' },
    { key: 'day', type: 'date', label: 'Day' },
    { key: 'cv', type: 'file', label: 'CV' },
    { key: 'ref', type: 'hidden' },
    { key: 'note', type: 'text', label: 'Note', show: [{ field: 'plan', eq: 'team' }] },
    { key: 'people', type: 'group', label: 'People', fields: [{ key: 'first', type: 'text', label: 'First' }] },
  ],
});

const recall = (text: string, values: Record<string, unknown>, item?: { group: string; index: number }, version?: string) =>
  recallText(definition(version), text, values, item);

describe('recallText', () => {
  it('shows each value kind', () => {
    const values = {
      name: 'Ada',
      plan: 'pro',
      tags: ['a', 'b'],
      agree: true,
      seats: 3,
      day: '2026-01-02',
      cv: [{ name: 'cv.pdf' }, { name: 'photo.png' }],
      people: [{ first: 'Bo' }, {}],
    };
    expect(recall('{{name}}|{{ plan }}|{{tags}}|{{agree}}|{{seats}}|{{day}}|{{cv}}|{{people}}', values)).toBe(
      'Ada|Pro|Alpha, Beta|I agree|3|2026-01-02|cv.pdf, photo.png|2',
    );
  });

  it('shows empty text for false, missing and unknown values', () => {
    expect(recall('[{{agree}}][{{name}}][{{nope}}][{{tags}}]', { agree: false, tags: [] })).toBe('[][][][]');
  });

  it('shows a hidden field value', () => {
    expect(recall('{{ref}}', { ref: 42 })).toBe('42');
  });

  it('keeps an option value without a matching option', () => {
    expect(recall('{{plan}}', { plan: 'gold' })).toBe('gold');
  });

  it('reads item fields inside a group item', () => {
    const values = { name: 'Ada', people: [{ first: 'Bo' }, { first: 'Cy' }] };
    expect(recall('{{first}} {{name}}', values, { group: 'people', index: 1 })).toBe('Cy Ada');
    expect(recall('[{{first}}]', values)).toBe('[]');
    expect(recall('[{{first}}]', values, { group: 'people', index: 2 })).toBe('[]');
    expect(recall('{{plan}}', { ...values, plan: 'team' }, { group: 'people', index: 0 })).toBe('Team');
  });

  it('does not expand a recalled value again', () => {
    expect(recall('{{name}}', { name: '{{plan}}', plan: 'pro' })).toBe('{{plan}}');
  });

  it('caps a recalled value at the string limit', () => {
    expect(recall('{{name}}', { name: 'x'.repeat(10001) })).toHaveLength(10000);
  });

  it('keeps the text below format 1.5', () => {
    expect(recall('Hi {{name}}', { name: 'Ada' }, undefined, '1.4')).toBe('Hi {{name}}');
  });

  it('leaves single braces and malformed tokens alone', () => {
    expect(recall('{name} {{ }} {{a b}}', { name: 'Ada' })).toBe('{name} {{ }} {{a b}}');
  });

  it('reads the values a field hidden by a condition no longer holds', () => {
    const engine = new FormEngine(definition(), { plan: 'pro', note: 'kept' });
    expect(recallText(engine.definition, '[{{note}}]', engine.getSubmitValues())).toBe('[]');
    engine.setValue('plan', 'team');
    engine.setValue('note', 'shown');
    expect(recallText(engine.definition, '[{{note}}]', engine.getSubmitValues())).toBe('[shown]');
  });
});

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

  it('asks for format 1.5 when a text recalls an answer', () => {
    expect(warnings(steps('1.4', { description: '{{name}}' }))).toEqual([{ code: 'outdated-format-version', path: '/formatVersion' }]);
    expect(checkDefinition(steps('1.4', { description: '{{name}}' }))[0].message).toContain('needs format 1.5');
  });

  it('reports a translation that drops or adds a recall token', () => {
    const source = steps('1.5', { description: 'Thanks {{name}}' });
    expect(translationIssues(source, { steps: { two: { description: 'Danke' } } }).placeholderMismatch).toEqual(['steps.two.description']);
    expect(translationIssues(source, { steps: { two: { description: 'Danke {{ name }}' } } }).placeholderMismatch).toEqual([]);
    expect(translationIssues(source, { steps: { one: { title: 'Eins {{name}}' } } }).placeholderMismatch).toEqual(['steps.one.title']);
  });
});
