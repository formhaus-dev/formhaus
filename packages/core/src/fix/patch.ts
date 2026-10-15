export type PatchOperation =
  | { op: 'add' | 'replace'; path: string; value: unknown }
  | { op: 'remove'; path: string }
  | { op: 'move'; from: string; path: string };

type Container = Record<string, unknown> | unknown[];

const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);

function fail(problem: string): never {
  throw new Error(`Invalid patch: ${problem}`);
}

export function parsePointer(pointer: string): string[] {
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) fail(`${JSON.stringify(pointer)} is not a JSON pointer to a property`);
  const tokens = pointer
    .slice(1)
    .split('/')
    .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));
  const unsafe = tokens.find((token) => UNSAFE.has(token));
  if (unsafe !== undefined) fail(`"${unsafe}" is not allowed in ${pointer}`);
  return tokens;
}

const isContainer = (value: unknown): value is Container => typeof value === 'object' && value !== null;

function has(container: Container, token: string): boolean {
  return Array.isArray(container)
    ? /^(0|[1-9]\d*)$/.test(token) && Number(token) < container.length
    : Object.prototype.hasOwnProperty.call(container, token);
}

function parentOf(root: unknown, pointer: string): [Container, string] {
  const tokens = parsePointer(pointer);
  const last = tokens.pop()!;
  let node = root;
  for (const token of tokens) {
    if (!isContainer(node) || !has(node, token)) fail(`${pointer} does not exist`);
    node = (node as Record<string, unknown>)[token];
  }
  if (!isContainer(node)) fail(`${pointer} does not exist`);
  return [node, last];
}

function replace(root: unknown, pointer: string, value: unknown): void {
  const [parent, token] = parentOf(root, pointer);
  if (!has(parent, token)) fail(`${pointer} does not exist`);
  (parent as Record<string, unknown>)[token] = value;
}

function remove(root: unknown, pointer: string): unknown {
  const [parent, token] = parentOf(root, pointer);
  if (!has(parent, token)) fail(`${pointer} does not exist`);
  if (Array.isArray(parent)) return parent.splice(Number(token), 1)[0];
  const value = parent[token];
  delete parent[token];
  return value;
}

function add(root: unknown, pointer: string, value: unknown): void {
  const [parent, token] = parentOf(root, pointer);
  if (!Array.isArray(parent)) {
    const lead = (token === 'id' || token === 'key') && !has(parent, token);
    const rest = lead ? Object.entries(parent) : [];
    for (const [name] of rest) delete parent[name];
    parent[token] = value;
    for (const [name, item] of rest) parent[name] = item;
    return;
  }
  const index = token === '-' ? parent.length : /^(0|[1-9]\d*)$/.test(token) ? Number(token) : -1;
  if (index < 0 || index > parent.length) fail(`${pointer} is not a valid array position`);
  parent.splice(index, 0, value);
}

const copy = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

export function applyFix<T>(definition: T, patch: readonly PatchOperation[]): T {
  if (!Array.isArray(patch)) fail('the patch must be an array of operations');
  const root = copy(definition);
  for (const operation of patch) {
    const { op, path } = operation ?? ({} as PatchOperation);
    if (op === 'add') add(root, path, copy(operation.value));
    else if (op === 'replace') replace(root, path, copy(operation.value));
    else if (op === 'remove') remove(root, path);
    else if (op === 'move') {
      if (path === operation.from || path.startsWith(`${operation.from}/`)) fail(`${path} is inside ${operation.from}`);
      add(root, path, remove(root, operation.from));
    } else fail(`${JSON.stringify(op)} is not a supported operation`);
  }
  return root;
}
