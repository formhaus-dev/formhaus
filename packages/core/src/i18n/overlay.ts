import { templateTokens } from '../engine/recall';
import { hasOwn, isEntry } from '../visibility/nodes';
export type Overlay = { [key: string]: string | Overlay };

export const addresses = (path: string[]): string[][] => (path[0] === 'steps' && path[2] === 'fields' ? [path, path.slice(2)] : [path]);

export function lookup(overlay: unknown, path: string[]): string | undefined {
  for (const address of addresses(path)) {
    let node = overlay;
    for (const key of address) node = isEntry(node) && hasOwn(node, key) ? node[key] : undefined;
    if (typeof node === 'string' && node.trim()) return node;
  }
}

function define(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
}

export function assign(target: Overlay, path: string[], value: string): void {
  let node: Overlay = target;
  for (const key of path.slice(0, -1)) {
    if (!hasOwn(node, key) || !isEntry(node[key])) define(node, key, {});
    node = node[key] as Overlay;
  }
  define(node, path[path.length - 1], value);
}

export function leaves(overlay: unknown, path: string[] = []): { path: string[]; value: unknown }[] {
  if (!isEntry(overlay)) return [{ path, value: overlay }];
  return Object.keys(overlay).flatMap((key) => leaves(overlay[key], [...path, key]));
}

export const addressKey = (path: string[]) => JSON.stringify(path);

export const placeholders = (text: string) => [...new Set(templateTokens(text))].sort();
