import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from '../../src/html';
import { form } from './fixtures';

describe('native attributes', () => {
  const markup = (field: object, values?: Record<string, unknown>) =>
    renderToStaticMarkup(form([{ key: 'a', label: 'A', ...field } as never]), { values });

  it('marks required fields', () => {
    expect(markup({ type: 'text', validation: { required: true } })).toContain(' required');
    expect(markup({ type: 'select', options: [{ value: 'x', label: 'X' }], validation: { required: true } })).toContain(
      '<select id="fh-a" name="a" required',
    );
    expect(markup({ type: 'radio', options: [{ value: 'x', label: 'X' }], validation: { required: true } })).toContain(
      'type="radio" class="fh-field__radio" value="x" required',
    );
  });

  it('never makes a whole checkbox group required', () => {
    expect(markup({ type: 'multiselect', options: [{ value: 'x', label: 'X' }], validation: { required: true } })).not.toMatch(
      /<input[^>]* required/,
    );
  });

  it('maps input types', () => {
    expect(markup({ type: 'email' })).toContain('type="email"');
    expect(markup({ type: 'phone' })).toContain('type="tel"');
    expect(markup({ type: 'password' })).toContain('type="password"');
    expect(markup({ type: 'datetime' })).toContain('type="datetime-local"');
  });

  it('maps length limits on text fields only', () => {
    expect(markup({ type: 'text', validation: { minLength: 2, maxLength: 9 } })).toContain('minlength="2" maxlength="9"');
    expect(markup({ type: 'textarea', validation: { maxLength: 9 } })).toContain('maxlength="9"');
    expect(markup({ type: 'number', validation: { minLength: 2 } })).not.toContain('minlength');
  });

  it('maps number bounds and allows decimals', () => {
    expect(markup({ type: 'number', validation: { min: 1, max: 5 } })).toContain('min="1" max="5" step="any"');
    expect(markup({ type: 'text', validation: { min: 1 } })).not.toContain('min=');
  });

  it('turns a pattern into a search pattern', () => {
    expect(markup({ type: 'text', validation: { pattern: '^[0-9]{3}' } })).toContain('pattern=".*(?:^[0-9]{3}).*"');
  });

  it('leaves out a pattern on other types', () => {
    expect(markup({ type: 'number', validation: { pattern: '1' } })).not.toContain('pattern=');
  });

  it('passes autocomplete, placeholder, rows and input mode', () => {
    expect(markup({ type: 'text', autocomplete: 'email', placeholder: 'p', inputMode: 'numeric' })).toContain('autocomplete="email"');
    expect(markup({ type: 'textarea', rows: 6 })).toContain('rows="6"');
    expect(markup({ type: 'textarea', rows: 0 })).toContain('rows="3"');
  });

  it('writes checkbox values as present or absent', () => {
    expect(markup({ type: 'checkbox' }, { a: true })).toMatch(/type="checkbox"[^>]* checked/);
    expect(markup({ type: 'checkbox' }, { a: false })).not.toContain('checked');
  });
});

describe('values', () => {
  it('fills inputs, selects and choices from the given values', () => {
    const markup = renderToStaticMarkup(
      form([
        { key: 't', type: 'text', label: 'T' },
        {
          key: 's',
          type: 'select',
          label: 'S',
          options: [
            { value: 'x', label: 'X' },
            { value: 'y', label: 'Y' },
          ],
        },
        {
          key: 'r',
          type: 'radio',
          label: 'R',
          options: [
            { value: 'x', label: 'X' },
            { value: 'y', label: 'Y' },
          ],
        },
        {
          key: 'm',
          type: 'multiselect',
          label: 'M',
          options: [
            { value: 'x', label: 'X' },
            { value: 'y', label: 'Y' },
          ],
        },
      ]),
      { values: { t: 'hello', s: 'y', r: 'x', m: ['y'] } },
    );
    expect(markup).toContain('value="hello"');
    expect(markup).toContain('<option value="y" selected>Y</option>');
    expect(markup).toContain('value="x" checked');
    expect(markup).toContain('value="y" checked');
  });

  it('uses default values when none are given', () => {
    expect(renderToStaticMarkup(form([{ key: 't', type: 'text', label: 'T', defaultValue: 'pre' }]))).toContain('value="pre"');
  });

  it('renders an options list for a field that loads its options', () => {
    const field = { key: 'c', type: 'select', label: 'C', optionsFrom: 'countries' } as const;
    const markup = renderToStaticMarkup(form([field]), { options: { c: [{ value: 'de', label: 'Germany' }] } });
    expect(markup).toContain('<option value="de">Germany</option>');
  });

  it('keeps options of a field that does not load them', () => {
    const field = { key: 'c', type: 'select', label: 'C', options: [{ value: 'a', label: 'A' }] } as const;
    const markup = renderToStaticMarkup(form([field]), { options: { c: [{ value: 'b', label: 'B' }] } });
    expect(markup).toContain('>A</option>');
    expect(markup).not.toContain('>B</option>');
  });

  it('puts ids under the given prefix', () => {
    const markup = renderToStaticMarkup(form([{ key: 't', type: 'text', label: 'T' }]), { id: 'signup' });
    expect(markup).toContain('id="signup-t"');
  });
});
