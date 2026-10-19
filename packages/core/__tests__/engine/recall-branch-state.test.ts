import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine, recallText, type FormDefinition, type FormField, type FormGroup } from '../../src';
import { itemTitle, recalled } from '../../src/internal';

const way = (defaultValue?: string): FormField => ({
  key: 'way',
  type: 'radio',
  label: 'Way',
  defaultValue,
  options: [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ],
});

const branches = (start: FormField, a: FormField, b: FormField, skip = false): FormDefinition => ({
  formatVersion: '1.5',
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'start',
      title: 'Start',
      fields: [start],
      ...(skip && { skip: { label: 'Skip' } }),
      routes: [{ to: 'b', show: [{ field: 'way', eq: 'b' }] }],
    },
    { id: 'a', title: 'A', fields: [a], routes: [{ to: 'review' }] },
    { id: 'b', title: 'B', fields: [b] },
    { id: 'review', title: 'Review', description: '[{{plan}}]', fields: [] },
  ],
});

const people = (type: string): FormGroup => ({
  key: 'people',
  type: 'group',
  label: 'People',
  itemLabel: 'Item [{{credential}}]',
  fields: [{ key: 'credential', type, label: 'Credential' }],
});

const plan = (label: string): FormField => ({ key: 'plan', type: 'select', label: 'Plan', options: [{ value: 'x', label }] });

describe('recall with the engine route state', () => {
  it('hides a group child that is a password in any definition of the group', () => {
    const definition = branches(way(), people('text'), people('password'));
    const engine = new FormEngine(definition, { way: 'b', people: [{ credential: 'hunter2' }] });
    engine.setValue('way', 'a');
    const group = definition.steps![1].fields[0] as FormGroup;
    expect(engine.getSubmitValues().people).toEqual([{ credential: 'hunter2' }]);
    expect(itemTitle(engine, group, 0)).toBe('Item []');
    expect(checkDefinition(definition).map(({ code, path }) => `${code} ${path}`)).toContain(
      'recall-sensitive-field /steps/1/fields/0/itemLabel',
    );
  });

  it('routes recall as the engine does after a skipped step', async () => {
    const definition = branches(way('b'), plan('Plan A'), plan('Plan B'), true);
    const engine = new FormEngine(definition);
    expect(await engine.skip()).toBe(true);
    engine.setValue('plan', 'x');
    expect(await engine.next()).toBe(true);
    const review = definition.steps![3];
    expect(recalled(engine, review).description).toBe('[Plan B]');
    expect(recallText(definition, review.description!, engine.getSubmitValues(), { engine })).toBe('[Plan B]');
    expect(recallText(definition, review.description!, engine.getSubmitValues())).toBe('[Plan A]');
  });
});
