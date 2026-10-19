import { describe, expect, it } from 'vitest';
import { FormEngine, type FormDefinition, type FormField } from '../../src';
import { autofilled } from '../../src/internal';

const definition: FormDefinition = {
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields: ['guests', 'guests1', 'my group'].map((key) => ({
    key,
    type: 'group',
    label: key,
    defaultItems: 11,
    fields: [{ key: 'name', type: 'text', label: 'Name' }],
  })),
};

const engine = new FormEngine(definition);
const token = (path: string, autocomplete: unknown = 'name') =>
  autofilled(engine, { key: path, type: 'text', label: 'N', autocomplete } as FormField, path).autocomplete;

describe('autofilled', () => {
  it('keeps sections of similar group keys apart', () => {
    expect(token('guests.10.name')).toBe('section-guests-10 name');
    expect(token('guests1.0.name')).toBe('section-guests1-0 name');
  });

  it('encodes keys that are not token safe', () => {
    expect(token('my group.2.name')).toBe('section-my_20_group-2 name');
  });

  it('leaves on, off, section tokens and one-time-code in place', () => {
    expect(token('guests.0.name', 'off')).toBe('off');
    expect(token('guests.0.name', 'one-time-code')).toBe('section-guests-0 one-time-code');
  });

  it('composes an own section with the item section', () => {
    expect(token('guests.0.name', 'section-home street-address')).toBe('section-guests-0-home street-address');
    expect(token('guests.1.name', 'Section-Home billing name')).toBe('section-guests-1-Home billing name');
  });

  it('ignores a token outside a group item and a value that is not text', () => {
    expect(token('guests')).toBe('name');
    expect(token('guests.0.name', 123)).toBe(123);
  });
});
