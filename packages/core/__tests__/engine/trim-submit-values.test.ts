import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src';
import { validateSubmission } from '../../src/server';

const definition = {
  id: 'trim',
  title: 'Trim',
  submit: { label: 'Send' },
  fields: [
    { key: 'email', type: 'email' as const, label: 'Email' },
    { key: 'notes', type: 'textarea' as const, label: 'Notes' },
    { key: 'secret', type: 'password' as const, label: 'Secret' },
  ],
};
const values = { email: '  a@b.co ', notes: ' a\n b ', secret: ' p ' };
const trimmed = { email: 'a@b.co', notes: 'a\n b', secret: ' p ' };

describe('whitespace trimming', () => {
  it('trims submit values and keeps the typed values', () => {
    const engine = new FormEngine(definition, values);
    expect(engine.getSubmitValues()).toEqual(trimmed);
    expect(engine.values).toEqual(values);
    expect(engine.validate()).toEqual({});
  });

  it('passes trimmed values to the submit handler', async () => {
    let received: unknown;
    const engine = new FormEngine(definition, values);
    await engine.submit((submitted) => {
      received = submitted;
    });
    expect(received).toEqual(trimmed);
  });

  it('matches the server', () => {
    expect(validateSubmission(definition, values)).toEqual({ values: trimmed, errors: {} });
  });
});
