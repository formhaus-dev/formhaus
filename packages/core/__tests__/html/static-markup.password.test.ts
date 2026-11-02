import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from '../../src/html';
import { form } from './fixtures';

const PASSWORD = 'hunter2-value';

describe('static markup never writes a password value', () => {
  const definition = form([
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'pass', type: 'password', label: 'Password', validation: { required: true, minLength: 20 } },
  ]);

  it('renders the field empty', () => {
    const markup = renderToStaticMarkup(definition, { values: { email: 'a@b.c', pass: PASSWORD } });
    expect(markup).not.toContain(PASSWORD);
    expect(markup).toContain('type="password"');
    expect(markup).toContain('value="a@b.c"');
  });

  it('leaves it out of read-only and error renders', () => {
    const markup = renderToStaticMarkup(definition, {
      values: { pass: PASSWORD },
      readOnly: true,
      errors: { pass: 'Too short' },
      formErrors: ['Try again'],
    });
    expect(markup).not.toContain(PASSWORD);
  });

  it('leaves it out of recalled text', () => {
    const recall = form([
      { key: 'pass', type: 'password', label: 'Password' },
      { key: 'x', type: 'text', label: 'Pass {{pass}}' },
    ]);
    expect(renderToStaticMarkup(recall, { values: { pass: PASSWORD } })).not.toContain(PASSWORD);
  });
});
