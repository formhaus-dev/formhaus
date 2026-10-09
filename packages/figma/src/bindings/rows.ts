import type { PluginConfig } from '../config';
import { componentForBinding, missingProperties } from '../renderers/resolve';
import { ROLES, type Role } from '../roles';
import { describeSlots, type SlotMap } from './slots';

export interface BindingRow {
  role: Role;
  name?: string;
  missing?: boolean;
  staleProperties?: string[];
  thumbnail?: Uint8Array;
  candidates?: string[];
  slots?: SlotMap;
}

const THUMBNAIL: ExportSettingsImage = { format: 'PNG', constraint: { type: 'HEIGHT', value: 96 } };

export async function bindingRows(config: PluginConfig): Promise<BindingRow[]> {
  return Promise.all(ROLES.map(async (role): Promise<BindingRow> => {
    const binding = config.bindings[role];
    if (!binding) return { role };
    const component = await componentForBinding(binding);
    if (!component) return { role, name: binding.name, missing: true };
    const thumbnail = await component.exportAsync(THUMBNAIL).catch(() => undefined);
    const stale = missingProperties(component, binding);
    return {
      role,
      name: binding.name ?? component.name,
      thumbnail,
      staleProperties: stale.length > 0 ? stale : undefined,
      ...describeSlots(component, binding),
    };
  }));
}
