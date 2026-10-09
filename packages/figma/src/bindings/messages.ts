import { readConfig, writeConfig, type PluginConfig, type TextSlot } from '../config';
import { addProfile, applyBindings, importedProfile, listProfiles, saveProfile, updateProfiles } from '../profiles';
import type { Role } from '../roles';
import { autoMatch } from './auto-match';
import { bindingRows } from './rows';
import { componentFromSelection } from './selection';
import { assignSlot } from './slots';

export interface BindingMessage {
  type: string;
  role?: Role;
  slot?: TextSlot;
  name?: string;
  id?: string;
  profile?: unknown;
}

export interface Notice {
  text: string;
  tone: 'success' | 'info';
  profileId?: string;
}

const HANDLERS: Record<string, (config: PluginConfig, message: BindingMessage) => Promise<Notice | void>> = {
  getBindings: async () => undefined,
  bindSelection: async (config, { role }) => {
    const { binding } = await componentFromSelection(figma.currentPage.selection);
    config.bindings[role!] = binding;
    config.source = 'custom';
    return { text: `Bound ${binding.name}.`, tone: 'success' };
  },
  unbind: async (config, { role }) => {
    delete config.bindings[role!];
  },
  setSlot: async (config, { role, slot, name }) => {
    const binding = config.bindings[role!];
    if (binding) binding.text = assignSlot(binding.text ?? {}, slot!, name ?? '');
  },
  saveProfile: async (config, { name }) => {
    const profile = await saveProfile(name ?? '', config.bindings);
    const local = Object.values(config.bindings).some((binding) => binding?.source === 'local');
    const reuse = profile.useInNewFiles ? ' New files will use it.' : '';
    const warning = local ? ' Components from this file work elsewhere once their library is published.' : '';
    return { text: `Saved “${profile.name}”.${reuse}${warning}`, tone: 'success', profileId: profile.id };
  },
  applyProfile: async (config, { id }) => {
    const profile = (await listProfiles()).find((item) => item.id === id);
    if (!profile) return;
    applyBindings(config, profile);
    return { text: `Using “${profile.name}” in this file.`, tone: 'success', profileId: profile.id };
  },
  importProfile: async (config, { profile: input }) => {
    const profile = importedProfile(input);
    if (!profile) throw new Error('This setup code has no components in it.');
    await addProfile(profile);
    applyBindings(config, profile);
    return { text: `Added “${profile.name}” and used it in this file.`, tone: 'success', profileId: profile.id };
  },
  deleteProfile: async (_, { id }) => {
    await updateProfiles((list) => list.filter((item) => item.id !== id));
  },
  toggleNewFiles: async (_, { id }) => {
    await updateProfiles((list) => list.map((item) => ({ ...item, useInNewFiles: item.id === id ? !item.useInNewFiles : false })));
  },
  autoMatch: async (config) => {
    const found = autoMatch(figma.currentPage, config.bindings);
    const count = Object.keys(found).length;
    Object.assign(config.bindings, found);
    if (count > 0) config.source = 'custom';
    if (count > 0) return { text: `Matched ${count} components on this page.`, tone: 'success' };
    return { text: 'Nothing new to match on this page. Name components like Text field, Dropdown or Button / Primary, or bind them by hand.', tone: 'info' };
  },
};

export function isBindingMessage(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(HANDLERS, type);
}

export async function runBindingMessage(message: BindingMessage) {
  const config = readConfig();
  const notice = await HANDLERS[message.type](config, message);
  writeConfig(config);
  return { rows: await bindingRows(config), notice, profiles: await listProfiles() };
}
