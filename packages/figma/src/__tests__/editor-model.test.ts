import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import {
  addField, addOption, addStep, keyFromLabel, moveField, removeField, removeStep, renameField, renameOption, setRequired, setType, steps,
} from '../ui/editor/model';

const form = (): FormDefinition => ({
  id: 'f', title: 'Sign up', submit: { label: 'Go' },
  fields: [
    { key: 'email', type: 'email', label: 'Email', validation: { required: true, pattern: '@' } },
    { key: 'plan', type: 'radio', label: 'Plan', options: [{ value: 'pro', label: 'Pro' }] },
  ],
});

describe('keyFromLabel', () => {
  it('builds unique camelCase keys', () => {
    expect(keyFromLabel('First name', new Set())).toBe('firstName');
    expect(keyFromLabel('E-mail address!', new Set(['eMailAddress']))).toBe('eMailAddress2');
    expect(keyFromLabel('2nd line', new Set())).toBe('field2nd' + 'Line');
    expect(keyFromLabel('   ', new Set())).toBe('field');
    expect(keyFromLabel('Электронная почта', new Set())).toBe('elektronnayaPochta');
    expect(keyFromLabel('Café crème', new Set())).toBe('cafeCreme');
  });
});

describe('editing fields', () => {
  it('adds a field with a unique key and options for choice types', () => {
    const draft = form();
    const field = addField(draft, 0, 'select');
    expect(field.key).toBe('newField');
    expect(field.options).toHaveLength(2);
    expect(addField(draft, 0, 'text').key).toBe('newField2');
  });

  it('renames the key with the label until something references it', () => {
    const draft = form();
    const field = addField(draft, 0, 'text');
    renameField(draft, field, 'Phone number');
    expect(field.key).toBe('phoneNumber');
    draft.fields!.push({ key: 'ext', type: 'text', label: 'Ext', show: [{ field: 'phoneNumber', notEmpty: true }] });
    renameField(draft, field, 'Mobile');
    expect(field.key).toBe('phoneNumber');
  });

  it('keeps other validation rules when toggling required', () => {
    const field = form().fields![0];
    setRequired(field, false);
    expect(field.validation).toEqual({ pattern: '@' });
    setRequired(field, true);
    expect(field.validation).toEqual({ pattern: '@', required: true });
  });

  it('drops options when switching to a type without them', () => {
    const field = form().fields![1];
    setType(field, 'text');
    expect(field.options).toBeUndefined();
    setType(field, 'select');
    expect(field.options).toHaveLength(1);
  });

  it('keeps option values that conditions refer to', () => {
    const draft = form();
    const plan = draft.fields![1];
    addOption(plan);
    const added = plan.options![1];
    renameOption(draft, plan, added, 'Team');
    expect(added.value).toBe('team');
    draft.fields!.push({ key: 'seats', type: 'number', label: 'Seats', show: [{ field: 'plan', eq: 'team' }] });
    renameOption(draft, plan, added, 'Business');
    expect(added).toEqual({ value: 'team', label: 'Business' });
  });
});

describe('references', () => {
  it('keeps following the label when the key matches a property name', () => {
    const draft = form();
    const field = addField(draft, 0, 'text');
    renameField(draft, field, 'Type');
    renameField(draft, field, 'Type of account');
    expect(field.key).toBe('typeOfAccount');
  });

  it('treats disabled conditions on actions and array defaults as references', () => {
    const draft = form();
    const terms = addField(draft, 0, 'checkbox');
    renameField(draft, terms, 'Terms');
    draft.submit = { label: 'Go', disabled: [{ field: 'terms', neq: true }] };
    renameField(draft, terms, 'Accept terms');
    expect(terms.key).toBe('terms');
    expect(removeField(draft, 0, 2)).toContain('Accept terms');
    const plan = draft.fields![1];
    plan.defaultValue = ['pro'];
    renameOption(draft, plan, plan.options![0], 'Professional');
    expect(plan.options![0].value).toBe('pro');
  });

  it('refuses to delete a field or step that a condition or route uses', () => {
    const draft = form();
    draft.fields!.push({ key: 'seats', type: 'number', label: 'Seats', show: [{ field: 'plan', eq: 'pro' }] });
    expect(removeField(draft, 0, 1)).toContain('Plan');
    expect(draft.fields).toHaveLength(3);
    expect(removeField(draft, 0, 2)).toBeNull();
    addStep(draft);
    addStep(draft);
    draft.steps![0].routes = [{ to: 'step-2' }];
    expect(removeStep(draft, 1)).toContain('Step 2');
    expect(removeStep(draft, 2)).toBeNull();
  });
});

describe('steps', () => {
  it('turns a single form into steps and back without losing fields', () => {
    const draft = form();
    addStep(draft);
    expect(draft.fields).toBeUndefined();
    expect(steps(draft).map((step) => [step.id, step.fields.length])).toEqual([['step-1', 2], ['step-2', 0]]);
    moveField(draft, [0, 0], [1, 0]);
    expect(steps(draft)[1].fields[0].key).toBe('email');
    removeStep(draft, 0);
    removeStep(draft, 0);
    expect(draft.steps).toBeUndefined();
    expect(draft.fields!.map((field) => field.key)).toEqual(['email']);
  });

  it('moves a field down within a step', () => {
    const draft = form();
    moveField(draft, [0, 0], [0, 2]);
    expect(draft.fields!.map((field) => field.key)).toEqual(['plan', 'email']);
  });
});
