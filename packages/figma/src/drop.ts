import type { PluginConfig } from './config';
import { createKitRenderer } from './renderers/kit-renderer';
import { ROLES, type Role } from './roles';

export function droppedRole(event: DropEvent): Role | undefined {
  const role = (event.dropMetadata as { role?: string } | undefined)?.role;
  return ROLES.find((candidate) => candidate === role);
}

export async function placeRole(event: DropEvent, role: Role, config: PluginConfig): Promise<SceneNode> {
  const renderer = await createKitRenderer(config);
  const node = await renderer.sample(role);
  const target = event.node;
  const nested = target.type !== 'DOCUMENT' && 'appendChild' in target;
  (nested ? target : figma.currentPage).appendChild(node);
  node.x = nested ? event.x : event.absoluteX;
  node.y = nested ? event.y : event.absoluteY;
  figma.currentPage.selection = [node];
  return node;
}
