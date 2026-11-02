import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FormDefinition, FormField } from '../../src';
import { renderToStaticMarkup } from '../../src/html';

const schema = JSON.parse(readFileSync(new URL('../../schema/form-definition.schema.json', import.meta.url), 'utf8'));
const types: string[] = schema.definitions.DefaultFieldType.enum;

const options = [{ value: 'a', label: 'A' }];

function definition(type: string): FormDefinition {
  const field = {
    key: 'q',
    type,
    label: 'Q',
    options: ['select', 'autocomplete', 'radio', 'multiselect', 'scale', 'rating'].includes(type) ? options : undefined,
  };
  return { formatVersion: '1.8', id: 'f', title: 'T', submit: { label: 'Go' }, fields: [field as FormField] };
}

describe('static markup field types', () => {
  it('knows the default field types of the format', () => {
    expect(types.length).toBeGreaterThan(15);
  });

  it.each(types.filter((type) => type !== 'file'))('renders %s', (type) => {
    const markup = renderToStaticMarkup(definition(type));
    expect(markup).not.toContain('fh-field--unsupported');
    expect(markup).toContain('name="q"');
  });

  it('rejects file, the one default type it does not render', () => {
    expect(() => renderToStaticMarkup(definition('file'))).toThrow(/file "q"/);
  });

  it('marks a field type of its own as unsupported', () => {
    expect(renderToStaticMarkup(definition('signature'))).toContain('fh-field--unsupported');
  });
});
