import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import {
  addField,
  addOption,
  createForm,
  findField,
  fromDefinition,
  lockIdentifiers,
  setKey,
  setLabel,
  setOptionLabel,
  setStepTitle,
  toDefinition,
  unlockKey,
} from '../src';

const plan: FormDefinition = {
  id: 'plan',
  title: 'Plan',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'plan',
      type: 'radio',
      label: 'Plan',
      options: [
        { value: 'pro', label: 'Pro' },
        { value: 'free', label: 'Free' },
      ],
    },
    { key: 'seats', type: 'number', label: 'Seats', show: [{ field: 'plan', eq: 'pro' }] },
    { key: 'confirm', type: 'text', label: 'Confirm', validation: { matchField: 'seats' } },
  ],
};

describe('identifiers', () => {
  it('derives a key from the label while unlocked', () => {
    const form = createForm();
    const item = addField(form, { step: null });
    expect(item.key).toBe('question');
    setLabel(form, item.uid, 'Work email');
    expect(item.key).toBe('workEmail');
  });

  it('keeps keys unique and stable', () => {
    const form = createForm();
    const first = addField(form, { step: null }, { label: 'Name' });
    const second = addField(form, { step: null }, { label: 'Name' });
    expect([first.key, second.key]).toEqual(['name', 'name2']);
    setLabel(form, second.uid, 'Name ');
    expect(second.key).toBe('name2');
  });

  it('never renames a locked key', () => {
    const form = fromDefinition(plan, { lockedFrom: plan });
    const [first] = form.blocks;
    setLabel(form, first.uid, 'Subscription');
    expect(toDefinition(form).fields?.[0].key).toBe('plan');
  });

  it('renames references when an unlocked key follows its label', () => {
    const form = fromDefinition(plan);
    setLabel(form, form.blocks[0].uid, 'Subscription');
    setLabel(form, form.blocks[1].uid, 'Members');
    const fields = toDefinition(form).fields!;
    expect(fields[0].key).toBe('subscription');
    expect(fields[1].show).toEqual([{ field: 'subscription', eq: 'pro' }]);
    expect(fields[2].validation?.matchField).toBe('members');
  });

  it('renames condition values when an unlocked option value follows its label', () => {
    const form = fromDefinition(plan);
    const field = findField(form, form.blocks[0].uid)!;
    setOptionLabel(form, field.uid, field.options[0].uid, 'Business');
    expect(toDefinition(form).fields?.[1].show).toEqual([{ field: 'plan', eq: 'business' }]);
  });

  it('renames contains values when an unlocked option value follows its label', () => {
    const form = fromDefinition({
      ...plan,
      fields: [
        { ...plan.fields![0], type: 'multiselect' },
        { key: 'note', type: 'text', label: 'Note', show: [{ field: 'plan', contains: 'pro' }] },
      ],
    });
    const field = findField(form, form.blocks[0].uid)!;
    setOptionLabel(form, field.uid, field.options[0].uid, 'Business');
    expect(toDefinition(form).fields?.[1].show).toEqual([{ field: 'plan', contains: 'business' }]);
  });

  it('locks everything after publish', () => {
    const form = fromDefinition(plan);
    lockIdentifiers(form);
    setLabel(form, form.blocks[1].uid, 'Members');
    expect(findField(form, form.blocks[1].uid)?.key).toBe('seats');
  });

  it('treats a manual key as locked and can unlock it again', () => {
    const form = createForm();
    const item = addField(form, { step: null }, { label: 'Email' });
    setKey(form, item.uid, 'contactEmail');
    setLabel(form, item.uid, 'Your email');
    expect(item.key).toBe('contactEmail');
    unlockKey(form, item.uid);
    expect(item.key).toBe('yourEmail');
  });

  it('slugs option values and step ids', () => {
    const form = createForm();
    const item = addField(form, { step: null }, { type: 'radio', label: 'Size' });
    setOptionLabel(form, item.uid, item.options[0].uid, 'Extra large');
    addOption(form, item.uid, undefined, 'Extra large');
    expect(item.options.map((option) => option.value)).toEqual(['extra-large', 'option-2', 'extra-large-2']);
    const steps = fromDefinition({
      id: 'x',
      title: 'X',
      submit: { label: 'Go' },
      steps: [
        { id: 'about-you', title: 'About you', fields: [] },
        { id: 'more', title: 'More', fields: [] },
      ],
    });
    setStepTitle(steps, steps.blocks[0].uid, 'Your details');
    expect(toDefinition(steps).steps?.[0].id).toBe('your-details');
  });
});
