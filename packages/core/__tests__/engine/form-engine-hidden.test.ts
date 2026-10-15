import { describe, expect, it } from 'vitest';
import { FormEngine, type FormDefinition, type FormField } from '../../src';
import { validateSubmission } from '../../src/server';

const definition: FormDefinition = {
  id: 'signup',
  title: 'Sign up',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'about',
      title: 'About',
      fields: [
        { key: 'source', type: 'hidden', label: 'Source', defaultValue: 'direct', validation: { pattern: '^[a-z]+$', patternMessage: 'Unknown source' } },
        { key: 'name', type: 'text', label: 'Name' },
      ],
    },
    { id: 'contact', title: 'Contact', fields: [{ key: 'email', type: 'email', label: 'Email' }] },
  ],
};

describe('hidden fields', () => {
  it('submits the default value and lets initial values override it', () => {
    expect(new FormEngine(definition).getSubmitValues()).toEqual({ source: 'direct' });
    expect(new FormEngine(definition, { source: 'newsletter' }).getSubmitValues()).toEqual({ source: 'newsletter' });
  });

  it('reports a client error on a hidden field at form level', async () => {
    const engine = new FormEngine(definition, { source: 'News Letter' });
    expect(await engine.next()).toBe(false);
    expect(engine.errors).toEqual({ source: 'Unknown source' });
    expect(engine.topLevelErrors).toEqual(['Unknown source']);
    expect(engine.stepErrors).toEqual({});
  });

  it('turns a server error on a hidden field into a form-level error without moving steps', async () => {
    const engine = new FormEngine(definition);
    await engine.next();
    engine.setErrors({ source: 'Expired campaign' });
    expect(engine.topLevelErrors).toEqual(['Expired campaign']);
    expect(engine.stepErrors).toEqual({});
    expect(engine.currentStep?.id).toBe('contact');
    engine.setErrors({ source: 'Expired campaign', name: 'Taken' });
    expect(engine.errors).toEqual({ source: 'Expired campaign', name: 'Taken' });
    expect(engine.topLevelErrors).toEqual(['Expired campaign']);
    expect(engine.currentStep?.id).toBe('about');
  });

  it('validates a hidden field as text on the server', () => {
    expect(validateSubmission(definition, { source: 'news letter', email: 'a@b.co' }).errors).toEqual({ source: 'Unknown source' });
    expect(validateSubmission(definition, { source: ['a'] }).errors).toEqual({ source: 'Source: Must be text' });
  });
});

describe('hidden field messages', () => {
  const single = (field: Partial<FormField>): FormDefinition => ({
    id: 'f', title: 'F', submit: { label: 'Send' }, fields: [{ key: 'source', type: 'hidden', label: 'Source', ...field }],
  });

  it('names the field in a built-in message and keeps a custom one', () => {
    expect(new FormEngine(single({ validation: { required: true } })).validate()).toEqual({ source: 'Source: This field is required' });
    expect(new FormEngine(single({ label: '', validation: { required: true } })).validate()).toEqual({ source: 'source: This field is required' });
    expect(new FormEngine(single({ validation: { required: 'Open the invite link' } })).validate()).toEqual({ source: 'Open the invite link' });
    expect(validateSubmission(single({ validation: { required: true } }), {}).errors).toEqual({ source: 'Source: This field is required' });
  });

  it('translates the template with the messages catalog', () => {
    const definition = { ...single({ validation: { required: true } }), messages: { required: 'Pflichtfeld', hidden: '{message} ({label})' } };
    expect(new FormEngine(definition).validate()).toEqual({ source: 'Pflichtfeld (Source)' });
    expect(validateSubmission(definition, {}).errors).toEqual({ source: 'Pflichtfeld (Source)' });
  });
});

describe('revealed hidden fields', () => {
  const definition: FormDefinition = {
    id: 'f', title: 'F', submit: { label: 'Send' }, fields: [
      { key: 'plan', type: 'radio', label: 'Plan', options: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }] },
      { key: 'campaign', type: 'hidden', label: 'Campaign', defaultValue: 'spring', show: [{ field: 'plan', eq: 'pro' }] },
      { key: 'note', type: 'text', label: 'Note', defaultValue: 'hi', show: [{ field: 'plan', eq: 'pro' }] },
    ],
  };

  it('gets its default value back when its conditions match again', () => {
    const engine = new FormEngine(definition);
    expect(engine.values).toEqual({});
    engine.setValue('plan', 'pro');
    expect(engine.getSubmitValues()).toEqual({ plan: 'pro', campaign: 'spring' });
    engine.setValue('plan', 'free');
    expect(engine.values).toEqual({ plan: 'free' });
    engine.setValue('plan', 'pro');
    expect(engine.values).toEqual({ plan: 'pro', campaign: 'spring' });
  });

  it('prefers the initial value and follows reset', () => {
    const engine = new FormEngine(definition, { campaign: 'from-url' });
    engine.setValue('plan', 'pro');
    expect(engine.values.campaign).toBe('from-url');
    engine.reset({ campaign: 'other' });
    engine.setValue('plan', 'pro');
    expect(engine.values.campaign).toBe('other');
  });
});
