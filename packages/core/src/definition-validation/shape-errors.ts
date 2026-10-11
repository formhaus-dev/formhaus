type Entry = Record<string, unknown>;
type Check = (value: unknown, path: string) => string[];

export const isEntry = (value: unknown): value is Entry =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function listOf(value: unknown, path: string, check: Check, required = false): string[] {
  if (value === undefined && !required) return [];
  if (!Array.isArray(value)) return [`${path} must be an array.`];
  return value.flatMap((item, index) => check(item, `${path}[${index}]`));
}

function entry(name: string, check: (value: Entry, path: string) => string[]): Check {
  return (value, path) => (isEntry(value) ? check(value, path) : [`${path} must be ${name}.`]);
}

const condition = entry('a condition object', () => []);

function conditions(value: Entry, path: string): string[] {
  return [...listOf(value.show, `${path}.show`, condition), ...listOf(value.showAny, `${path}.showAny`, condition)];
}

const field = entry('a field object', conditions);
const route = entry('a route object', conditions);
const step = entry('a step object', (value, path) => [
  ...listOf(value.fields, `${path}.fields`, field, true),
  ...conditions(value, path),
  ...listOf(value.routes, `${path}.routes`, route),
]);

export function shapeErrors(definition: unknown): string[] {
  if (!isEntry(definition)) return ['Form definition must be an object.'];
  return [...listOf(definition.fields, 'fields', field), ...listOf(definition.steps, 'steps', step)];
}
