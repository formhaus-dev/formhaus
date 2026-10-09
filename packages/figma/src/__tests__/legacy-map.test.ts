import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindingsFromMap, migrateStoredMap, type LegacyMap } from '../bindings/legacy-map';

function variant(name: string, key: string) {
  return { type: 'COMPONENT', name, key, remote: true, parent: { type: 'COMPONENT_SET', name: 'Set' } };
}

const sets: Record<string, { children: ReturnType<typeof variant>[] }> = {
  fc: { children: [
    variant('Type=Input, Header=False, Helper_text=False', 'input-bare'),
    variant('Type=Input, Header=True, Helper_text=True', 'input-full'),
    variant('Type=Select, Header=True, Helper_text=True', 'select-full'),
  ] },
  sel: { children: [variant('Type=Checkbox, State=Static, Checked=False', 'checkbox'), variant('Type=Radio, State=Static, Checked=False', 'radio')] },
  btn: { children: [variant('Type=Primary,Left_Icon=False,Right_Icon=False,Color=Brand,State=Static', 'primary'), variant('Type=Secondary, Color=Gray', 'secondary')] },
};

const map: LegacyMap = {
  formsConstructorKey: 'fc',
  buttonKey: 'btn',
  fields: {
    text: { formsConstructorVariant: 'Input' },
    select: { formsConstructorVariant: 'Select' },
    textarea: { formsConstructorVariant: 'Textarea' },
    checkbox: { standaloneKey: 'sel', variantProps: { Type: 'Checkbox', State: 'Static', Checked: 'False' } },
    radio: { standaloneKey: 'sel', variantProps: { Type: 'Radio', State: 'Static', Checked: 'False' } },
    switch: { standaloneKey: 'YOUR_SWITCH_COMPONENT_KEY' },
    date: { missing: true },
  },
  textLayerNames: { label: 'Header', placeholder: 'Placeholder', helperText: 'Helper text' },
};

let stored: unknown;
let saved: Record<string, unknown>;
const data = new Map<string, string>();

beforeEach(() => {
  data.clear();
  stored = map;
  saved = {};
  vi.stubGlobal('figma', {
    importComponentSetByKeyAsync: async (key: string) => {
      if (!sets[key]) throw new Error('not found');
      return sets[key];
    },
    clientStorage: {
      getAsync: async (key: string) => (key === 'formhaus-component-map' ? stored : saved[key]),
      setAsync: async (key: string, value: unknown) => { saved[key] = value; },
      deleteAsync: async (key: string) => { if (key === 'formhaus-component-map') stored = undefined; },
    },
    root: {
      getSharedPluginData: (_: string, key: string) => data.get(key) ?? '',
      setSharedPluginData: (_: string, key: string, value: string) => void data.set(key, value),
    },
  });
});

describe('bindingsFromMap', () => {
  it('binds the full variants with the old text layer names and skips missing parts', async () => {
    const bindings = await bindingsFromMap(map);
    expect(bindings['field.text']).toMatchObject({ source: 'library', key: 'input-full', text: { label: 'Header', value: 'Placeholder', helper: 'Helper text' } });
    expect(bindings['field.select']?.key).toBe('select-full');
    expect(bindings['field.textarea']).toBeUndefined();
    expect(bindings['field.checkbox']?.key).toBe('checkbox');
    expect(bindings['option.radio']?.key).toBe('radio');
    expect(bindings['field.switch']).toBeUndefined();
    expect(bindings['button.primary']).toMatchObject({ key: 'primary', text: { label: 'Button Text' } });
    expect(bindings['button.secondary']?.key).toBe('secondary');
  });
});

describe('migrateStoredMap', () => {
  it('moves a saved map into an unconfigured document once', async () => {
    expect(await migrateStoredMap()).toBe(7);
    expect(JSON.parse(data.get('config')!)).toMatchObject({ source: 'custom' });
    expect(saved['formhaus-profiles']).toEqual([expect.objectContaining({ name: 'Saved component map', useInNewFiles: true })]);
    expect(stored).toBeUndefined();
    expect(await migrateStoredMap()).toBe(0);
  });

  it('retries later when nothing could be imported', async () => {
    stored = { ...map, formsConstructorKey: 'gone', buttonKey: 'gone', fields: {} };
    expect(await migrateStoredMap()).toBe(0);
    expect(data.get('mapMigrated')).toBeUndefined();
    stored = map;
    expect(await migrateStoredMap()).toBe(7);
  });

  it('leaves documents that already use a kit or bindings alone', async () => {
    data.set('config', JSON.stringify({ source: 'kit' }));
    expect(await migrateStoredMap()).toBe(0);
    stored = undefined;
    data.clear();
    expect(await migrateStoredMap()).toBe(0);
  });
});
