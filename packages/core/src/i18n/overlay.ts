export type Overlay = { [key: string]: string | Overlay };

export const isEntry = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

export function lookup(overlay: unknown, path: string[]): string | undefined {
  let node = overlay;
  for (const key of path) node = isEntry(node) && own(node, key) ? node[key] : undefined;
  return typeof node === 'string' && node.trim() ? node : undefined;
}

function define(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
}

export function assign(target: Overlay, path: string[], value: string): void {
  let node: Overlay = target;
  for (const key of path.slice(0, -1)) {
    if (!own(node, key) || !isEntry(node[key])) define(node, key, {});
    node = node[key] as Overlay;
  }
  define(node, path[path.length - 1], value);
}

export function leaves(overlay: unknown, path: string[] = []): { path: string[]; value: unknown }[] {
  if (!isEntry(overlay)) return [{ path, value: overlay }];
  return Object.keys(overlay).flatMap((key) => leaves(overlay[key], [...path, key]));
}

export const addressKey = (path: string[]) => JSON.stringify(path);

export const placeholders = (text: string) => [...new Set(text.match(/\{\w+\}/g) ?? [])].map((name) => name.slice(1, -1)).sort();
