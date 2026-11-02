import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '../../src';
import { renderToStaticMarkup } from '../../src/html';
import { form } from './fixtures';

const field = form([{ key: 'a', type: 'text', label: 'A' }]);

describe('definitions static markup does not render', () => {
  const section = (inner: object): FormDefinition =>
    form([{ key: 's', type: 'section', title: 'S', fields: [inner as never] }], { formatVersion: '1.1' });

  it.each([
    ['a file field', form([{ key: 'cv', type: 'file', label: 'CV' }]), /file "cv"/],
    ['a file field in a section', section({ key: 'cv', type: 'file', label: 'CV' }), /file "cv"/],
    [
      'a group',
      form([{ key: 'g', type: 'group', label: 'G', fields: [{ key: 'q', type: 'text', label: 'Q' }] }], { formatVersion: '1.1' }),
      /group "g"/,
    ],
    [
      'steps',
      {
        id: 'f',
        title: 'T',
        submit: { label: 'Go' },
        steps: [{ id: 'a', title: 'A', fields: [{ key: 'a', type: 'text', label: 'A' }] }],
      } as FormDefinition,
      /steps/,
    ],
  ])('throws for %s', (_, definition, message) => {
    expect(() => renderToStaticMarkup(definition)).toThrow(message);
  });
});

describe('values that are not plain', () => {
  it.each([{ toString: 1 }, { valueOf: 1, toString: 2 }, [{ x: 1 }], { a: { toString: 1 } }])('ignores the value %j', (value) => {
    expect(() => renderToStaticMarkup(field, { values: { a: value } })).not.toThrow();
  });

  it('ignores keys the definition does not know and prototype keys', () => {
    const markup = renderToStaticMarkup(field, { values: JSON.parse('{"a":"1","other":"x","__proto__":{"y":1}}') });
    expect(markup).not.toContain('name="other"');
    expect(markup).toContain('value="1"');
  });
});

describe('texts that are not strings', () => {
  it('ignores them in errors, form errors and hidden inputs', () => {
    const bad = { toString: 1 } as never;
    expect(() => renderToStaticMarkup(field, { errors: { a: bad }, formErrors: [bad], hiddenInputs: { csrf: bad } })).not.toThrow();
  });
});

describe('hidden inputs', () => {
  it('rejects a field key that matches a hidden input', () => {
    expect(() => renderToStaticMarkup(form([{ key: 'csrf', type: 'text', label: 'A' }]), { hiddenInputs: { csrf: 'x' } })).toThrow(
      /hidden input/,
    );
  });
});
