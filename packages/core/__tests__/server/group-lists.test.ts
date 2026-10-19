import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormNode } from '../../src/types';

const form = (fields: FormNode[]): FormDefinition => ({ formatVersion: '1.1', id: 'g', title: 'G', submit: { label: 'Send' }, fields });

describe('validateSubmission with an invalid multiselect and a dependent sibling in group items', () => {
  const pick: FormNode = {
    key: 'pick',
    type: 'multiselect',
    label: 'Pick',
    options: ['a', 'b', 'c'].map((value) => ({ value, label: value })),
  };
  const missing = (show: Record<string, unknown>): FormNode => ({
    key: 'missing',
    type: 'text',
    label: 'Missing',
    validation: { required: true },
    show: [{ field: 'pick', ...show }],
  });
  const inGroup = (show: Record<string, unknown>): FormDefinition =>
    form([{ key: 'members', type: 'group', label: 'Members', fields: [pick, missing(show)] }]);
  const topLevel = (show: Record<string, unknown>): FormDefinition => form([pick, missing(show)]);

  it('keeps the sibling and reports only the multiselect error', () => {
    const result = validateSubmission(inGroup({ notContains: 'a' }), { members: [{ pick: ['a', 'b', 'c', 'd'], missing: 'keep' }] });
    expect(result).toEqual({
      values: { members: [{ missing: 'keep' }] },
      errors: { 'members.0.pick': 'Select one of the available options' },
    });
  });

  const answers: [string, unknown][] = [
    ['more answers than options', ['a', 'b', 'c', 'd']],
    ['more answers than the list limit', Array.from({ length: 1001 }, () => 'a')],
    ['an unknown option', ['a', 'z']],
    ['a repeated option', ['a', 'a']],
    ['a string', 'a'],
    ['a number', 5],
  ];
  const conditions = [{ contains: 'a' }, { notContains: 'a' }, { notContains: 'z' }];

  it.each(answers)('gives the same result for %s at top level and in a group item', (_, answer) => {
    for (const show of conditions) {
      const top = validateSubmission(topLevel(show), { pick: answer, missing: 'keep' });
      const item = validateSubmission(inGroup(show), { members: [{ pick: answer, missing: 'keep' }] });
      const unanswered = validateSubmission(topLevel(show), { missing: 'keep' });
      expect(top).toEqual({ values: unanswered.values, errors: { pick: expect.any(String) } });
      expect(item).toEqual({ values: { members: [top.values] }, errors: { 'members.0.pick': top.errors.pick } });
    }
  });

  it('never passes an invalid value to validators at top level or in a group item', () => {
    const received: unknown[] = [];
    const record = (value: unknown) => {
      received.push(value);
      return null;
    };
    const validators = { list: record, text: record };
    const fields: FormNode[] = [
      { ...pick, validation: { validator: 'list' } },
      { key: 'name', type: 'text', label: 'Name', validation: { validator: 'text' }, show: [{ field: 'pick', notContains: 'a' }] },
    ];
    const inItems = form([{ key: 'members', type: 'group', label: 'Members', fields }]);
    const members = [...answers.map(([, answer]) => ({ pick: answer, name: { nested: true } })), { pick: ['b'], name: 'Ada' }];
    const result = validateSubmission(inItems, { members }, { validators });
    expect(received).toEqual([['b'], 'Ada']);
    expect(Object.keys(result.errors)).toHaveLength(answers.length * 2);
    expect(result.values).toEqual({ members: [...answers.map(() => ({})), { pick: ['b'], name: 'Ada' }] });
    received.length = 0;
    for (const [, answer] of answers)
      expect(validateSubmission(form(fields), { pick: answer, name: { nested: true } }, { validators }).values).toEqual({});
    expect(received).toEqual([]);
  });
});

describe('a multiselect with more than 1000 options', () => {
  const options = Array.from({ length: 1001 }, (_, index) => ({ value: `o${index}`, label: `O${index}` }));
  const all = options.map(({ value }) => value);
  const fields: FormNode[] = [
    { key: 'pick', type: 'multiselect', label: 'Pick', options },
    { key: 'last', type: 'text', label: 'Last', validation: { required: true }, show: [{ field: 'pick', contains: 'o1000' }] },
  ];
  const topLevel = form(fields);
  const inGroup = form([{ key: 'members', type: 'group', label: 'Members', fields }]);

  it('accepts every option in the engine and on the server', () => {
    const engine = new FormEngine(topLevel, { pick: all });
    expect(engine.validate()).toEqual({ last: 'This field is required' });
    engine.setValue('pick', [...all]);
    engine.setValue('last', 'x');
    expect(engine.validate()).toEqual({});
    engine.reset({ pick: [...all] });
    expect(engine.validate()).toEqual({ last: 'This field is required' });
    expect(validateSubmission(topLevel, { pick: all, last: 'x' })).toEqual({ values: { pick: all, last: 'x' }, errors: {} });

    const items = new FormEngine(inGroup, { members: [{ pick: all }] });
    expect(items.validate()).toEqual({ 'members.0.last': 'This field is required' });
    items.setItemValue('members', 0, 'pick', [...all]);
    items.setItemValue('members', 0, 'last', 'x');
    expect(items.validate()).toEqual({});
    expect(validateSubmission(inGroup, { members: [{ pick: all, last: 'x' }] })).toEqual({
      values: { members: [{ pick: all, last: 'x' }] },
      errors: {},
    });
  });
});
