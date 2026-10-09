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

const HANDLERS: Record<string, (config: PluginConfig, message: BindingMessage) => Promise<string | void>> = {
  getBindings: async () => undefined,
  bindSelection: async (config, { role }) => {
    const { binding } = await componentFromSelection(figma.currentPage.selection);
    config.bindings[role!] = binding;
    config.source = 'custom';
    return `Bound ${binding.name}.`;
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
    return count > 0 ? `Matched ${count} components on this page.` : 'No matching components found on this page.';
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
