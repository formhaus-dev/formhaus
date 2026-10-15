import { describe, expect, it } from 'vitest';
import { draftValues, sessionDraftStore, type DraftStorage } from '../../src/cloud/draft';
import type { FormDefinition } from '../../src/types';

const definition: FormDefinition = {
  formatVersion: '1.1',
  id: 'd',
  title: 'D',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'secret', type: 'password', label: 'Secret' },
    { key: 'token', type: 'hidden', label: 'Token', defaultValue: 'abc' },
    { key: 'about', type: 'section', title: 'About', fields: [{ key: 'city', type: 'text', label: 'City' }] },
    {
      key: 'people',
      type: 'group',
      label: 'People',
      fields: [
        { key: 'email', type: 'email', label: 'Email' },
        { key: 'pin', type: 'password', label: 'PIN' },
      ],
    },
  ],
};

function memory(): DraftStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('drafts', () => {
  const values = { name: 'Ada', secret: 'pw', token: 'abc', city: 'Oslo', people: [{ email: 'a@x.io', pin: '1234' }, { email: 'b@x.io' }] };

  it('keeps answers, section fields and group items without passwords or hidden values', () => {
    expect(draftValues(definition, values)).toEqual({ name: 'Ada', city: 'Oslo', people: [{ email: 'a@x.io' }, { email: 'b@x.io' }] });
  });

  it('never writes a password inside a group item or a hidden value to storage', () => {
    const storage = memory();
    const store = sessionDraftStore(undefined, () => storage);
    store.save('d', 1, draftValues(definition, values));
    const saved = [...storage.data.values()].join();
    expect(saved).not.toContain('1234');
    expect(saved).not.toContain('pw');
    expect(saved).not.toContain('abc');
    expect(store.load('d', 1)).toEqual({ name: 'Ada', city: 'Oslo', people: [{ email: 'a@x.io' }, { email: 'b@x.io' }] });
  });
});
