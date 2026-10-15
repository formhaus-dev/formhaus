import { describe, expect, it } from 'vitest';
import { fieldDomId } from '../../src/internal';
import type { FormDefinition, FormField } from '../../src/types';

const form = (keys: string[]): FormDefinition => ({ id: 'f', title: '', submit: { label: 'Send' }, fields: keys.map((key): FormField => ({ key, type: 'text', label: key })) });

describe('fieldDomId', () => {
  it('keeps the id of keys that collide with no other key', () => {
    const definition = form(['email', 'first_name', 'contact.email', 'Ünit', 'a-b']);
    expect(['email', 'first_name', 'contact.email', 'Ünit', 'a-b'].map((key) => fieldDomId('form', key, definition))).toEqual(['form-email', 'form-first_name', 'form-contact-email', 'form--nit', 'form-a-b']);
    expect(fieldDomId(undefined, 'contact.email')).toBe('fh-contact-email');
  });

  it('gives the escaped key a suffix derived from the key when it collides', () => {
    const ids = (keys: string[]) => Object.fromEntries(keys.map((key) => [key, fieldDomId('form', key, form(keys))]));
    const forward = ids(['contact.email', 'contact-email', 'contact:email']);
    expect(forward['contact-email']).toBe('form-contact-email');
    expect(new Set(Object.values(forward)).size).toBe(3);
    expect(ids(['contact:email', 'contact-email', 'contact.email'])).toEqual(forward);
    expect(ids(['contact.email', 'contact:email'])['contact:email']).toBe(forward['contact:email']);
  });

  it('keeps one id for a key shared by fields on different branches', () => {
    const definition: FormDefinition = { id: 'f', title: '', submit: { label: 'Send' }, steps: [
      { id: 'one', title: 'One', fields: [{ key: 'a.b', type: 'text', label: 'A' }] },
      { id: 'two', title: 'Two', fields: [{ key: 'a.b', type: 'text', label: 'A' }] },
    ] };
    expect(fieldDomId('form', 'a.b', definition)).toBe('form-a-b');
  });
});
