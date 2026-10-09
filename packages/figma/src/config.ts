import type { Role } from './roles';

export const PLUGIN_NAMESPACE = 'formhaus';
const CONFIG_KEY = 'config';

export type KitId = 'material' | 'ios';
export type ComponentSource = 'kit' | 'custom';
export type TextSlot = 'label' | 'value' | 'helper';

export interface Binding {
  source: 'local' | 'library';
  id?: string;
  key?: string;
  variant?: Record<string, string>;
  text?: Partial<Record<TextSlot, string>>;
}

export interface PluginConfig {
  version: 1;
  source: ComponentSource;
  kit: KitId;
  bindings: Partial<Record<Role, Binding>>;
  kitNodes: Partial<Record<KitId, Partial<Record<Role, string>>>>;
}

export function defaultConfig(source: ComponentSource = 'kit'): PluginConfig {
  return { version: 1, source, kit: 'material', bindings: {}, kitNodes: {} };
}

export function readConfig(fallbackSource: ComponentSource = 'kit'): PluginConfig {
  const raw = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, CONFIG_KEY);
  if (!raw) return defaultConfig(fallbackSource);
  try {
    return { ...defaultConfig(fallbackSource), ...(JSON.parse(raw) as Partial<PluginConfig>) };
  } catch {
    return defaultConfig(fallbackSource);
  }
}

export function writeConfig(config: PluginConfig): void {
  figma.root.setSharedPluginData(PLUGIN_NAMESPACE, CONFIG_KEY, JSON.stringify(config));
}
