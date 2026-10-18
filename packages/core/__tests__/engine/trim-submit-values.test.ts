import { describe, expect, it } from 'vitest';
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
  it('matches the server', () => {
    expect(validateSubmission(definition, values)).toEqual({ values: trimmed, errors: {} });
  });
});
