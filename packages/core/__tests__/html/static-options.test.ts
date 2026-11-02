import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from '../../src/html';
import { form } from './fixtures';
import { unsafeMarkup } from './markup-safety';

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

const fields = form([
  { key: 'code', type: 'text', label: 'Code' },
  { key: 'pick', type: 'radio', label: 'Pick', options },
  { key: 'many', type: 'multiselect', label: 'Many', options },
  { key: 'rate', type: 'scale', label: 'Rate', min: 1, max: 3 },
  { key: 'agree', type: 'checkbox', label: 'Agree' },
  { key: 'town', type: 'select', label: 'Town', options },
  { key: 'note', type: 'textarea', label: 'Note' },
  { key: 'when', type: 'date', label: 'When' },
  { key: 'secret', type: 'hidden', label: 'Secret' },
  { key: 'shown', type: 'text', label: 'Shown', show: [{ field: 'code', eq: 'x' }] },
]);

const count = (markup: string): number => markup.split(' autofocus').length - 1;

describe('autofocus', () => {
  it('writes nothing when unset', () => {
    expect(renderToStaticMarkup(fields)).not.toContain('autofocus');
  });

  it.each(['code', 'agree', 'town', 'note', 'when'])('puts the attribute on the %s control', (key) => {
    const markup = renderToStaticMarkup(fields, { autofocus: key });
    expect(count(markup)).toBe(1);
    expect(markup).toMatch(new RegExp(`<(?:input|select|textarea)[^>]*name="${key}"[^>]* autofocus`));
  });

  it.each(['pick', 'many', 'rate'])('puts the attribute on the first control of %s', (key) => {
    const markup = renderToStaticMarkup(fields, { autofocus: key });
    expect(count(markup)).toBe(1);
    expect(markup).toMatch(new RegExp(`<input[^>]*id="fh-${key}-[01]"[^>]* autofocus`));
  });

  it('ignores a key that is not visible, unknown, hidden or read-only', () => {
    for (const key of ['shown', 'missing', 'secret', '', '__proto__', 'code" onfocus="x'])
      expect(renderToStaticMarkup(fields, { autofocus: key })).not.toContain('autofocus');
    expect(renderToStaticMarkup(fields, { autofocus: 'code', readOnly: true })).not.toContain('autofocus');
  });

  it('focuses a field once its condition is met', () => {
    expect(count(renderToStaticMarkup(fields, { autofocus: 'shown', values: { code: 'x' } }))).toBe(1);
  });

  it('ignores a value that is not a string', () => {
    expect(renderToStaticMarkup(fields, { autofocus: ['code'] as unknown as string })).not.toContain('autofocus');
  });
});

describe('secondary actions', () => {
  const cancel = { label: 'Cancel', name: 'decision', value: 'deny', novalidate: true };

  it('leaves the output unchanged when unset or empty', () => {
    expect(renderToStaticMarkup(fields, { secondaryActions: [] })).toBe(renderToStaticMarkup(fields));
  });

  it('writes the primary button first and named buttons after it', () => {
    const markup = renderToStaticMarkup(fields, { secondaryActions: [cancel] });
    const primary = markup.indexOf('fh-form-actions__button--primary');
    const secondary = markup.indexOf('fh-form-actions__button--secondary');
    expect(primary).toBeGreaterThan(0);
    expect(secondary).toBeGreaterThan(primary);
    expect(markup.match(/<button/g)).toHaveLength(2);
    expect(markup).toContain(
      '<button type="submit" class="fh-form-actions__button fh-form-actions__button--secondary" name="decision" value="deny" formnovalidate>Cancel</button>',
    );
    expect(markup).not.toContain('<div class="fh-form-actions__secondary"></div>');
  });

  it('keeps native validation unless asked', () => {
    const markup = renderToStaticMarkup(fields, { secondaryActions: [{ label: 'Later', name: 'later', value: '1' }] });
    expect(markup).not.toContain('formnovalidate');
  });

  it('skips malformed entries', () => {
    const bad = [null, 'x', { label: 'L', name: '', value: 'v' }, { label: 1, name: 'n', value: 'v' }, { label: 'L', name: 'n' }];
    const markup = renderToStaticMarkup(fields, { secondaryActions: bad as never });
    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(renderToStaticMarkup(fields, { secondaryActions: 'x' as never })).toBe(renderToStaticMarkup(fields));
  });

  it('throws when a field has the same name', () => {
    expect(() => renderToStaticMarkup(fields, { secondaryActions: [{ label: 'L', name: 'code', value: 'v' }] })).toThrow(
      /secondary action/,
    );
  });
});

describe('escaping', () => {
  const hostile = '"><script>alert(1)</script>\'&\0';

  it('escapes names, values and labels of secondary actions', () => {
    const markup = renderToStaticMarkup(fields, {
      secondaryActions: [{ label: hostile, name: hostile, value: hostile }],
      autofocus: 'code',
    });
    expect(markup).not.toContain('<script');
    expect(unsafeMarkup(markup)).toEqual([]);
  });

  it('escapes option values and labels with autofocus on', () => {
    const risky = form([
      {
        key: 'pick',
        type: 'radio',
        label: hostile,
        options: [{ value: hostile, label: hostile, description: hostile }],
      },
    ]);
    const markup = renderToStaticMarkup(risky, { autofocus: 'pick' });
    expect(markup).not.toContain('<script');
    expect(unsafeMarkup(markup)).toEqual([]);
  });

  it('never writes an autofocus key as markup', () => {
    const markup = renderToStaticMarkup(fields, { autofocus: hostile });
    expect(markup).not.toContain(hostile);
    expect(unsafeMarkup(markup)).toEqual([]);
  });
});
