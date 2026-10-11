import { describe, expect, it } from 'vitest';
import {
  addField, addStep, createForm, duplicateField, fromDefinition, isPage, moveField, moveFieldTo, moveStep,
  referencesTo, removeField, removeStep, splitAt, stepFields, stepNumber, toDefinition, type BuilderForm,
} from '../src';
import { template } from './fixtures';

const labels = (form: BuilderForm) => form.blocks.map((block) => (isPage(block) ? `#${block.title}` : block.label));

function contact() {
  const form = createForm('contact', 'Contact');
  const name = addField(form, { step: null }, { label: 'Name' });
  const email = addField(form, { step: null }, { type: 'email', label: 'Email', required: true });
  const message = addField(form, { step: null }, { type: 'textarea', label: 'Message' });
  return { form, name, email, message };
}

describe('field ops', () => {
  it('adds fields at the end of a step, after a field or at an index', () => {
    const { form, name } = contact();
    addField(form, { after: name.uid }, { label: 'Company' });
    addField(form, { step: null, index: 0 }, { label: 'First' });
    expect(labels(form)).toEqual(['First', 'Name', 'Company', 'Email', 'Message']);
  });

  it('duplicates with a fresh uid and a unique key', () => {
    const { form, email } = contact();
    const copy = duplicateField(form, email.uid)!;
    expect(copy.uid).not.toBe(email.uid);
    expect(copy.key).toBe('email2');
    expect(email.key).toBe('email');
    expect(copy.required).toBe(true);
  });

  it('removes a field but keeps the last one', () => {
    const form = createForm();
    const only = addField(form, { step: null });
    expect(removeField(form, only.uid)).toBe(false);
    const { form: full, email } = contact();
    expect(removeField(full, email.uid)).toBe(true);
    expect(labels(full)).toEqual(['Name', 'Message']);
  });

  it('moves fields by delta and across steps', () => {
    const { form, name, message } = contact();
    moveField(form, message.uid, -1);
    expect(labels(form)).toEqual(['Name', 'Message', 'Email']);
    const step = addStep(form);
    moveFieldTo(form, name.uid, step.uid, 0);
    expect(labels(form)).toEqual(['#Step 1', 'Message', 'Email', '#Step 2', 'Name']);
    moveFieldTo(form, name.uid, form.blocks[0].uid, 1);
    expect(labels(form)).toEqual(['#Step 1', 'Message', 'Name', 'Email', '#Step 2']);
  });

  it('lists the blocks that reference a key', () => {
    const form = fromDefinition(template('agency-fit-quiz.json'));
    const users = referencesTo(form, 'need');
    expect(users.length).toBe(1);
  });
});

describe('step ops', () => {
  it('wraps a flat form into steps when the first step is added', () => {
    const { form } = contact();
    addStep(form);
    expect(labels(form)).toEqual(['#Step 1', 'Name', 'Email', 'Message', '#Step 2']);
    expect(toDefinition(form).steps?.map((step) => step.id)).toEqual(['step-1', 'step-2']);
  });

  it('splits at a field', () => {
    const { form, email } = contact();
    splitAt(form, email.uid);
    expect(labels(form)).toEqual(['#Step 1', 'Name', '#Step 2', 'Email', 'Message']);
    expect(stepNumber(form, form.blocks[2].uid)).toBe(2);
    expect(stepFields(form, form.blocks[2].uid).map((item) => item.label)).toEqual(['Email', 'Message']);
  });

  it('removes a step with or without its fields and collapses to a flat form', () => {
    const { form, email } = contact();
    const second = splitAt(form, email.uid)!;
    removeStep(form, second.uid, 'keep-fields');
    expect(labels(form)).toEqual(['Name', 'Email', 'Message']);
    const again = splitAt(form, email.uid)!;
    removeStep(form, again.uid, 'with-fields');
    expect(labels(form)).toEqual(['Name']);
    expect(toDefinition(form).fields?.length).toBe(1);
  });

  it('moves the first step fields to the next step when it is removed', () => {
    const { form, email } = contact();
    splitAt(form, email.uid);
    removeStep(form, form.blocks[0].uid, 'keep-fields');
    expect(labels(form)).toEqual(['Name', 'Email', 'Message']);
  });

  it('moves a whole step', () => {
    const { form, email } = contact();
    const second = splitAt(form, email.uid)!;
    moveStep(form, second.uid, -1);
    expect(labels(form)).toEqual(['#Step 2', 'Email', 'Message', '#Step 1', 'Name']);
  });

  it('clears branch targets that point to a removed step', () => {
    const form = fromDefinition(template('agency-fit-quiz.json'));
    const resources = form.blocks.find((block) => isPage(block) && block.id === 'resources')!;
    removeStep(form, resources.uid, 'with-fields');
    const budget = toDefinition(form).steps?.find((step) => step.id === 'budget');
    expect(JSON.stringify(budget?.routes ?? [])).not.toContain('resources');
  });
});
