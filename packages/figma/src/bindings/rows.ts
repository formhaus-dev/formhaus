import type { PluginConfig } from '../config';
import { asComponent, componentForBinding, missingProperties } from '../renderers/resolve';
import { ROLE_FALLBACKS, ROLES, type Role } from '../roles';
import { describeSlots, type SlotMap } from './slots';

export interface BindingRow {
  role: Role;
  name?: string;
  via?: Role;
  missing?: boolean;
  staleProperties?: string[];
  thumbnail?: Uint8Array;
  candidates?: string[];
  slots?: SlotMap;
}

const MAX_WIDTH = 640;
const MAX_HEIGHT = 240;

export function thumbnail(node: SceneNode): Promise<Uint8Array | undefined> {
  const scale = Math.min(2, MAX_WIDTH / Math.max(node.width, 1), MAX_HEIGHT / Math.max(node.height, 1));
  return node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } }).catch(() => undefined);
}

async function kitThumbnail(config: PluginConfig, role: Role): Promise<Uint8Array | undefined> {
  const id = config.kitNodes[config.kit]?.[role];
  const node = id ? await figma.getNodeByIdAsync(id) : null;
  if (node?.type !== 'COMPONENT' && node?.type !== 'COMPONENT_SET') return undefined;
  return thumbnail(asComponent(node));
}

async function unboundRow(config: PluginConfig, role: Role): Promise<BindingRow> {
  const via = (ROLE_FALLBACKS[role] ?? []).find((candidate) => config.bindings[candidate]);
  const component = via ? await componentForBinding(config.bindings[via]!) : null;
  if (via && component) return { role, via, name: config.bindings[via]!.name, thumbnail: await thumbnail(component) };
  return { role, thumbnail: await kitThumbnail(config, role) };
}

export async function bindingRows(config: PluginConfig): Promise<BindingRow[]> {
  return Promise.all(ROLES.map(async (role): Promise<BindingRow> => {
    const binding = config.bindings[role];
    if (!binding) return unboundRow(config, role);
    const component = await componentForBinding(binding);
    if (!component) return { role, name: binding.name, missing: true };
    const stale = missingProperties(component, binding);
    return {
      role,
      name: binding.name ?? component.name,
      thumbnail: await thumbnail(component),
      staleProperties: stale.length > 0 ? stale : undefined,
      ...describeSlots(component, binding),
    };
  }));
}
