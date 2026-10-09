import { PLUGIN_NAMESPACE, readConfig, writeConfig, type Binding } from '../config';
import { saveProfile } from '../profiles';
import type { Role } from '../roles';
import { reference } from './selection';

interface LegacyField {
  formsConstructorVariant?: string;
  standaloneKey?: string;
  variantProps?: Record<string, string>;
  missing?: boolean;
}

export interface LegacyMap {
  formsConstructorKey?: string;
  buttonKey?: string;
  fields?: Record<string, LegacyField>;
  textLayerNames?: { label?: string; placeholder?: string; helperText?: string };
}

const STORAGE_KEY = 'formhaus-component-map';
const MIGRATED_KEY = 'mapMigrated';
const INPUT_ROLES: [Role, string][] = [['field.text', 'text'], ['field.select', 'select'], ['field.textarea', 'textarea']];
const CONTROL_ROLES: [Role, string][] = [['field.checkbox', 'checkbox'], ['option.checkbox', 'checkbox'], ['option.radio', 'radio'], ['field.switch', 'switch']];
const BUTTON_ROLES: [Role, string][] = [['button.primary', 'Primary'], ['button.secondary', 'Secondary']];

function variantProps(name: string): Record<string, string> {
  return Object.fromEntries(name.split(',').map((part) => part.split('=').map((item) => item.trim())).filter((pair) => pair.length === 2));
}

export function variantWith(set: ComponentSetNode, wanted: Record<string, string>, required: string[]): ComponentNode | null {
  const variants = set.children.filter((node): node is ComponentNode => node.type === 'COMPONENT');
  const matches = (node: ComponentNode, keys: string[]) => keys.every((key) => variantProps(node.name)[key] === wanted[key]);
  return variants.find((node) => matches(node, Object.keys(wanted))) ?? variants.find((node) => matches(node, required)) ?? null;
}

function usable(key?: string): key is string {
  return Boolean(key && !key.startsWith('YOUR_'));
}

async function importSet(key?: string): Promise<ComponentSetNode | null> {
  if (!usable(key)) return null;
  return figma.importComponentSetByKeyAsync(key).catch(() => null);
}

function compact(text: Record<string, string | undefined>): Binding['text'] {
  const entries = Object.entries(text).filter((entry): entry is [string, string] => Boolean(entry[1]));
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function bindingsFromMap(map: LegacyMap): Promise<Partial<Record<Role, Binding>>> {
  const bindings: Partial<Record<Role, Binding>> = {};
  const layers = map.textLayerNames ?? {};
  const inputText = compact({ label: layers.label, value: layers.placeholder, helper: layers.helperText });
  const constructor = await importSet(map.formsConstructorKey);
  for (const [role, type] of INPUT_ROLES) {
    const variant = map.fields?.[type]?.formsConstructorVariant;
    const node = constructor && variant ? variantWith(constructor, { Type: variant, Header: 'True', Helper_text: 'True' }, ['Type']) : null;
    if (node) bindings[role] = { ...reference(node), text: inputText };
  }
  for (const [role, type] of CONTROL_ROLES) {
    const mapping = map.fields?.[type];
    if (!mapping || mapping.missing) continue;
    const set = await importSet(mapping.standaloneKey);
    const wanted = mapping.variantProps ?? {};
    const node = set ? variantWith(set, wanted, Object.keys(wanted).slice(0, 1)) : null;
    if (node) bindings[role] = reference(node);
  }
  const buttons = await importSet(map.buttonKey);
  for (const [role, type] of BUTTON_ROLES) {
    const wanted = { Type: type, Left_Icon: 'False', Right_Icon: 'False', Color: 'Brand', State: 'Static' };
    const node = buttons ? variantWith(buttons, wanted, ['Type']) : null;
    if (node) bindings[role] = { ...reference(node), text: { label: 'Button Text' } };
  }
  return bindings;
}

export async function migrateStoredMap(): Promise<number> {
  if (figma.root.getSharedPluginData(PLUGIN_NAMESPACE, MIGRATED_KEY)) return 0;
  const stored = (await figma.clientStorage.getAsync(STORAGE_KEY).catch(() => undefined)) as LegacyMap | undefined;
  const config = readConfig('custom');
  if (!stored || config.source !== 'custom' || Object.keys(config.bindings).length > 0) return 0;
  const bindings = await bindingsFromMap(stored);
  const count = Object.keys(bindings).length;
  if (count === 0) return 0;
  figma.root.setSharedPluginData(PLUGIN_NAMESPACE, MIGRATED_KEY, '1');
  writeConfig({ ...config, source: 'custom', bindings });
  await saveProfile('Saved component map', bindings, true);
  await figma.clientStorage.deleteAsync(STORAGE_KEY);
  return count;
}
