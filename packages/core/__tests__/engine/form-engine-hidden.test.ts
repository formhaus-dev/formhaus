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
        {
          key: 'source',
          type: 'hidden',
          label: 'Source',
          defaultValue: 'direct',
          validation: { pattern: '^[a-z]+$', patternMessage: 'Unknown source' },
        },
        { key: 'name', type: 'text', label: 'Name' },
      ],
    },
    { id: 'contact', title: 'Contact', fields: [{ key: 'email', type: 'email', label: 'Email' }] },
  ],
};

describe('hidden fields', () => {
  it('validates a hidden field as text on the server', () => {
    expect(validateSubmission(definition, { source: 'news letter', email: 'a@b.co' }).errors).toEqual({ source: 'Unknown source' });
    expect(validateSubmission(definition, { source: ['a'] }).errors).toEqual({ source: 'Source: Must be text' });
  });
});

describe('hidden field messages', () => {
  const single = (field: Partial<FormField>): FormDefinition => ({
    id: 'f',
    title: 'F',
    submit: { label: 'Send' },
    fields: [{ key: 'source', type: 'hidden', label: 'Source', ...field }],
  });

  it('names the field in a built-in message and keeps a custom one', () => {
    expect(new FormEngine(single({ validation: { required: true } })).validate()).toEqual({ source: 'Source: This field is required' });
    expect(new FormEngine(single({ label: '', validation: { required: true } })).validate()).toEqual({
      source: 'source: This field is required',
    });
    const unlabeled: FormDefinition = { ...single({}), fields: [{ key: 'source', type: 'hidden', validation: { required: true } }] };
    expect(new FormEngine(unlabeled).validate()).toEqual({ source: 'source: This field is required' });
    expect(validateSubmission(unlabeled, {}).errors).toEqual({ source: 'source: This field is required' });
    expect(new FormEngine(single({ validation: { required: 'Open the invite link' } })).validate()).toEqual({
      source: 'Open the invite link',
    });
    expect(validateSubmission(single({ validation: { required: true } }), {}).errors).toEqual({ source: 'Source: This field is required' });
  });

  it('translates the template with the messages catalog', () => {
    const definition = {
      ...single({ validation: { required: true } }),
      messages: { required: 'Pflichtfeld', hidden: '{message} ({label})' },
    };
    expect(new FormEngine(definition).validate()).toEqual({ source: 'Pflichtfeld (Source)' });
    expect(validateSubmission(definition, {}).errors).toEqual({ source: 'Pflichtfeld (Source)' });
  });
});
