import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultConfig } from '../config';
import { applyBindings, applyDefaultProfile, importedProfile, listProfiles, saveProfile, updateProfiles } from '../profiles';

let storage: Record<string, unknown>;
let data: Map<string, string>;

function useDocument(): void {
  data = new Map();
  vi.stubGlobal('figma', {
    clientStorage: {
      getAsync: async (key: string) => storage[key],
      setAsync: async (key: string, value: unknown) => { storage[key] = value; },
    },
    root: {
      getSharedPluginData: (_: string, key: string) => data.get(key) ?? '',
      setSharedPluginData: (_: string, key: string, value: string) => void data.set(key, value),
    },
  });
}

const bindings = {
  'field.text': { source: 'local' as const, id: '3:32', key: 'text-key', name: 'Text field' },
  'button.primary': { source: 'library' as const, key: 'button-key', name: 'Button' },
  'field.date': { source: 'local' as const, id: '9:9', name: 'No key' },
};

beforeEach(() => {
  storage = {};
  useDocument();
});

describe('profiles', () => {
  it('keeps local ids in the file they came from and drops them elsewhere', async () => {
    const profile = await saveProfile('Acme DS', bindings);
    expect(profile.useInNewFiles).toBe(true);
    expect(Object.keys(profile.bindings)).toEqual(['field.text', 'button.primary']);
    const here = defaultConfig();
    applyBindings(here, profile);
    expect(here.bindings['field.text']).toMatchObject({ source: 'local', id: '3:32' });
    useDocument();
    const elsewhere = defaultConfig();
    applyBindings(elsewhere, profile);
    expect(elsewhere.bindings['field.text']).toEqual({ source: 'library', key: 'text-key', name: 'Text field' });
    expect(elsewhere.source).toBe('custom');
  });

  it('marks only one profile for new files', async () => {
    await saveProfile('First', bindings);
    await saveProfile('Second', bindings, true);
    expect((await listProfiles()).map((item) => [item.name, item.useInNewFiles])).toEqual([['First', false], ['Second', true]]);
  });

  it('applies the new-file profile only to files without a config', async () => {
    await saveProfile('Acme DS', bindings);
    useDocument();
    expect(await applyDefaultProfile()).toBe('Acme DS');
    expect(JSON.parse(data.get('config')!).source).toBe('custom');
    expect(await applyDefaultProfile()).toBeNull();
  });

  it('accepts only setup codes with keyed components', () => {
    expect(importedProfile({ name: 'Team DS', bindings })?.bindings['field.text']).toEqual({ source: 'library', key: 'text-key', name: 'Text field' });
    expect(importedProfile({ name: 'Empty', bindings: { 'field.date': bindings['field.date'] } })).toBeNull();
    expect(importedProfile('nonsense')).toBeNull();
  });

  it('strips unknown and oversized data from imported codes', () => {
    const profile = importedProfile({
      name: 'x'.repeat(500),
      bindings: {
        'field.text': { source: 'local', id: '1:1', key: 'k', name: 'Text', extra: 'drop', properties: { Size: 'M', Huge: 'y'.repeat(5000) }, text: { label: 'Label' } },
        'button.primary': { key: { evil: true } },
      },
    });
    expect(profile?.name).toHaveLength(80);
    expect(profile?.bindings).toEqual({ 'field.text': { source: 'library', key: 'k', name: 'Text', properties: { Size: 'M' }, text: { label: 'Label' } } });
  });

  it('applies concurrent profile updates in order', async () => {
    await saveProfile('Acme DS', bindings);
    const flip = () => updateProfiles((list) => list.map((item) => ({ ...item, useInNewFiles: !item.useInNewFiles })));
    await Promise.all([flip(), flip()]);
    expect((await listProfiles())[0].useInNewFiles).toBe(true);
  });
});
