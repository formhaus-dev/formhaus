import { describe, expect, it } from 'vitest';
import { FormEngine, isActionDisabled, type FieldType, type FormDefinition, type ShowCondition } from '../../src';
import { validateSubmission } from '../../src/server';

const conditions: [string, ShowCondition, (value: string) => boolean][] = [
  ['eq', { field: 'answer', eq: 'yes' }, (value) => value === 'yes'],
  ['neq', { field: 'answer', neq: 'yes' }, (value) => value !== 'yes'],
  ['notEmpty', { field: 'answer', notEmpty: true }, (value) => value !== ''],
];
const inputs = ['yes', ' yes ', '   '];
const matrix = conditions.flatMap(([name, condition, expected]) => inputs.map((input) => [name, JSON.stringify(input), condition, input, expected(input.trim())] as const));

const answer = (type: FieldType = 'text') => ({ key: 'answer', type, label: 'Answer' });

const showForm = (condition: ShowCondition, type?: FieldType): FormDefinition => ({
  id: 'show', title: 'Show', submit: { label: 'Send' },
  fields: [answer(type), { key: 'target', type: 'text', label: 'Target', show: [condition] }],
});

const routeForm = (condition: ShowCondition): FormDefinition => ({
  id: 'routes', title: 'Routes', submit: { label: 'Send' },
  steps: [
    { id: 'start', title: 'Start', fields: [answer()], routes: [{ to: 'matched', show: [condition] }, { to: 'other' }] },
    { id: 'other', title: 'Other', fields: [{ key: 'other', type: 'text', label: 'Other' }], routes: [{ to: null }] },
    { id: 'matched', title: 'Matched', fields: [{ key: 'matched', type: 'text', label: 'Matched' }] },
  ],
});

const disabledForm = (condition: ShowCondition): FormDefinition => ({
  id: 'disabled', title: 'Disabled', submit: { label: 'Send', disabled: [condition] }, fields: [answer()],
});

describe('conditions on trimmed text', () => {
  it.each(matrix)('show %s with %s', (_, __, condition, input, expected) => {
    const definition = showForm(condition);
    const engine = new FormEngine(definition, { answer: input, target: 't' });
    expect(engine.visibleFields.some(({ key }) => key === 'target')).toBe(expected);
    expect('target' in engine.getSubmitValues()).toBe(expected);
    expect('target' in validateSubmission(definition, { answer: input, target: 't' }).values).toBe(expected);
  });

  it.each(matrix)('routes %s with %s', (_, __, condition, input, expected) => {
    const definition = routeForm(condition);
    const values = { answer: input, matched: 'm', other: 'o' };
    const engine = new FormEngine(definition, values);
    expect(engine.visibleSteps.map(({ id }) => id)).toEqual(['start', expected ? 'matched' : 'other']);
    expect(Object.keys(engine.getSubmitValues()).sort()).toEqual(Object.keys(validateSubmission(definition, values).values).sort());
  });

  it.each(matrix)('disabled %s with %s', (_, __, condition, input, expected) => {
    const definition = disabledForm(condition);
    expect(isActionDisabled(definition.submit, new FormEngine(definition, { answer: input }).getSubmitValues())).toBe(expected);
  });

  it.each(['password', 'select', 'radio'] as const)('keeps %s values untrimmed in conditions', (type) => {
    const definition = showForm({ field: 'answer', eq: 'yes' }, type);
    const values = { answer: ' yes ', target: 't' };
    expect(new FormEngine(definition, values).visibleFields.map(({ key }) => key)).toEqual(['answer']);
    expect('target' in validateSubmission(definition, values).values).toBe(false);
  });
});
