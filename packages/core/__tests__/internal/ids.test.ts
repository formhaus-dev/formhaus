import { describe, expect, it } from 'vitest';
import { checkDefinition } from '../../src';
import { fieldDomId, itemDomId } from '../../src/internal';
import type { FormDefinition, FormField } from '../../src/types';

const form = (keys: string[]): FormDefinition => ({
  id: 'f',
  title: '',
  submit: { label: 'Send' },
  fields: keys.map((key): FormField => ({ key, type: 'text', label: key })),
});

describe('fieldDomId', () => {
  it('keeps --reveal out of field ids so reveal blocks stay unique', () => {
    const keys = ['q', 'q--reveal-0', 'q---reveal', 'q-reveal-0'];
    const ids = keys.map((key) => fieldDomId('form', key, form(keys)));
    expect(ids.some((id) => id.includes('--reveal'))).toBe(false);
    expect(new Set(ids).size).toBe(keys.length);
    expect(ids).not.toContain('form-q--reveal-0');
    expect(fieldDomId(undefined, 'a--reveal')).toBe('fh-a-reveal');
  });

  it('keeps the ids of a form whose keys only look alike', () => {
    const node = (key: string, type: string, extra = {}): FormField => ({ key, type, label: key, ...extra }) as FormField;
    const fields = [
      node('address', 'text'),
      node('address-2', 'text'),
      node('name', 'text'),
      node('name-error-free', 'text'),
      node('company', 'text'),
      node('company-description', 'text'),
      node('size', 'radio', { options: [{ value: 's', label: 'S' }] }),
      node('size-2', 'text'),
      node('size-0-description', 'text'),
      node('nps', 'scale', { validation: { min: 0, max: 3 } }),
      node('nps-9', 'text'),
      node('nps-anchor-0', 'text'),
      node('crew', 'group', { fields: [node('name', 'text')] }),
      node('crew-label', 'text'),
      node('crew-helper', 'text'),
    ];
    const definition: FormDefinition = { id: 'f', title: '', formatVersion: '1.1', submit: { label: 'Send' }, fields };
    expect(fields.map(({ key }) => fieldDomId('f', key, definition))).toEqual(fields.map(({ key }) => `f-${key}`));
  });

  it('moves a field id off the generated ids of another node', () => {
    const node = (key: string, type: string, extra = {}): FormField => ({ key, type, label: key, ...extra }) as FormField;
    const described = [
      { value: 'a', label: 'A', description: 'First' },
      { value: 'b', label: 'B', description: 'Second' },
    ];
    const fields = [
      node('plan', 'radio', { options: described, helperText: 'Pick' }),
      node('plan-helper', 'text'),
      node('plan-1', 'text'),
      node('plan-0-description', 'text'),
      node('plan-description', 'text'),
      node('nps', 'scale', { validation: { min: 0, max: 3 }, options: [{ value: '0', label: 'Low' }] }),
      node('nps-anchor', 'radio', { options: [{ value: 'x', label: 'X' }] }),
      node('nps-3', 'text'),
      node('city', 'autocomplete', { options: described }),
      node('city-list', 'text'),
      node('city-label', 'text'),
      node('docs', 'file', { multiple: true }),
      node('docs-notice', 'text'),
      { key: 'crew', type: 'group', label: 'Crew', fields: [node('name', 'text'), node('name-error', 'text')] } as FormField,
      node('crew-confirm', 'text'),
      node('crew-error', 'text'),
    ];
    const definition: FormDefinition = { id: 'f', title: '', formatVersion: '1.7', submit: { label: 'Send' }, fields };
    const ids = fields.map(({ key }) => fieldDomId('f', key, definition));
    expect(ids.filter((id, index) => id === `f-${fields[index].key}`)).toEqual([
      'f-plan',
      'f-nps',
      'f-city',
      'f-docs',
      'f-crew-confirm',
      'f-crew-error',
    ]);
    for (const [index, id] of ids.entries()) expect(id).toMatch(new RegExp(`^f-${fields[index].key}(-[0-9a-z]+)?$`));
    expect(itemDomId('f', 'crew', 0, 'name', definition)).toMatch(/^f-crew-[0-9a-z]+--0--name$/);
    expect(itemDomId('f', 'crew', 0, 'name-error', definition)).toMatch(/^f-crew-[0-9a-z]+--0--name-error-[0-9a-z]+$/);
    expect(fieldDomId('f', 'plan-helper', definition)).toBe(fieldDomId('f', 'plan-helper', { ...definition, fields: [...fields] }));
  });

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

  describe('keeps item ids apart from keys that look like item ids', () => {
    const crew = (key: string, children: string[]): FormField => ({
      key,
      type: 'group',
      label: key,
      fields: children.map((child) => ({ key: child, type: 'text', label: child })),
    });
    const nodes = (fields: FormField[]): FormDefinition => {
      const definition: FormDefinition = { formatVersion: '1.1', id: 'f', title: '', submit: { label: 'Send' }, fields };
      expect(checkDefinition(definition)).toEqual([]);
      return definition;
    };

    it('a top-level key against an item field', () => {
      const definition = nodes([{ key: 'crew--0--contact-email', type: 'text', label: 'A' }, crew('crew', ['contact-email'])]);
      expect(fieldDomId('f', 'crew--0--contact-email', definition)).toBe('f-crew--0--contact-email');
      expect(itemDomId('f', 'crew', 0, 'contact-email', definition)).not.toBe('f-crew--0--contact-email');
      expect(itemDomId('f', 'crew', 0, undefined, definition)).not.toMatch(/^f-crew--0--contact-email/);
    });

    it('two groups whose item ids meet', () => {
      const definition = nodes([crew('crew--0', ['contact-email']), crew('crew', ['0--contact-email'])]);
      const first = itemDomId('f', 'crew--0', 0, 'contact-email', definition);
      expect(first).toBe('f-crew--0--0--contact-email');
      expect(itemDomId('f', 'crew', 0, '0--contact-email', definition)).not.toBe(first);
    });

    it('keeps the plain ids of groups without such keys', () => {
      const definition = nodes([{ key: 'crew-0', type: 'text', label: 'A' }, crew('crew', ['name']), crew('crews', ['name'])]);
      expect(itemDomId('f', 'crew', 0, 'name', definition)).toBe('f-crew--0--name');
      expect(itemDomId('f', 'crews', 0, 'name', definition)).toBe('f-crews--0--name');
    });
  });
});
