import { describe, expect, it } from 'vitest';
import { fieldDomId, itemDomId } from '../../src/internal';
import type { FormDefinition, FormField } from '../../src/types';

const form = (keys: string[]): FormDefinition => ({
  id: 'f',
  title: '',
  submit: { label: 'Send' },
  fields: keys.map((key): FormField => ({ key, type: 'text', label: key })),
});

describe('fieldDomId', () => {
  it('keeps the id of keys that collide with no other key', () => {
    const definition = form(['email', 'first_name', 'contact.email', 'Ünit', 'a-b']);
    expect(['email', 'first_name', 'contact.email', 'Ünit', 'a-b'].map((key) => fieldDomId('form', key, definition))).toEqual([
      'form-email',
      'form-first_name',
      'form-contact-email',
      'form--nit',
      'form-a-b',
    ]);
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
    const definition: FormDefinition = {
      id: 'f',
      title: '',
      submit: { label: 'Send' },
      steps: [
        { id: 'one', title: 'One', fields: [{ key: 'a.b', type: 'text', label: 'A' }] },
        { id: 'two', title: 'Two', fields: [{ key: 'a.b', type: 'text', label: 'A' }] },
      ],
    };
    expect(fieldDomId('form', 'a.b', definition)).toBe('form-a-b');
  });

  it('gives sections and item fields ids that collide with no other node', () => {
    const child = (key: string): FormField => ({ key, type: 'text', label: key });
    const definition: FormDefinition = {
      formatVersion: '1.1',
      id: 'f',
      title: '',
      submit: { label: 'Send' },
      steps: [
        {
          id: 'one',
          title: 'One',
          fields: [
            { key: 'contact.email', type: 'section', title: 'Contact', fields: [child('phone')] },
            child('contact-email'),
            { key: 'crew', type: 'group', label: 'Crew', fields: [child('contact.email'), child('contact-email')] },
          ],
        },
        { id: 'two', title: 'Two', fields: [{ key: 'crew', type: 'group', label: 'Crew', fields: [child('a.b')] }] },
      ],
    };
    expect(fieldDomId('form', 'contact-email', definition)).toBe('form-contact-email');
    expect(fieldDomId('form', 'contact.email', definition)).not.toBe('form-contact-email');
    const items = ['contact-email', 'contact.email', 'a.b'].map((key) => itemDomId('form', 'crew', 1, key, definition));
    expect(items[0]).toBe('form-crew--1--contact-email');
    expect(items[2]).toBe('form-crew--1--a-b');
    expect(new Set(items).size).toBe(3);
    expect(itemDomId('form', 'crew', 1, 'contact.email')).toBe('form-crew--1--contact-email');
  });
});
