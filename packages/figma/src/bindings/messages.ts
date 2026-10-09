import { readConfig, writeConfig, type ComponentSource, type PluginConfig, type TextSlot } from '../config';
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
}

export interface Notice {
  text: string;
  tone: 'success' | 'info';
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

export async function runBindingMessage(message: BindingMessage, fallbackSource: ComponentSource = 'kit') {
  const config = readConfig(fallbackSource);
  const notice = await HANDLERS[message.type](config, message);
  writeConfig(config);
  return { rows: await bindingRows(config), notice };
}
