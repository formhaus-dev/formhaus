import type { DefinitionIssue } from './issues';
import { error, warning } from './issues';

type Entry = Record<string, unknown>;
type Check = (value: Entry, path: string) => DefinitionIssue[];

export const isEntry = (value: unknown): value is Entry =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function list(value: unknown, path: string, name: string, check: Check, required = false): DefinitionIssue[] {
  if (value == null && !required) return [];
  if (!Array.isArray(value)) return [error('invalid-type', path, 'must be an array', required ? 'Use [] when there is nothing to list' : undefined)];
  return value.flatMap((item, index) => (
    isEntry(item) ? check(item, `${path}/${index}`) : [error('invalid-type', `${path}/${index}`, `must be ${name}`)]
  ));
}

function text(value: Entry, key: string, path: string): DefinitionIssue[] {
  return typeof value[key] === 'string' ? [] : [error('missing-property', `${path}/${key}`, `"${key}" must be a string`)];
}

const none: Check = () => [];

function conditions(value: Entry, path: string): DefinitionIssue[] {
  return [
    ...list(value.show, `${path}/show`, 'a condition object', none),
    ...list(value.showAny, `${path}/showAny`, 'a condition object', none),
  ];
}

function action(value: unknown, path: string): DefinitionIssue[] {
  return isEntry(value) ? list(value.disabled, `${path}/disabled`, 'a condition object', none) : [];
}

const field: Check = (value, path) => [...text(value, 'key', path), ...text(value, 'type', path), ...conditions(value, path)];

const route: Check = (value, path) => [
  ...(value.to === null || typeof value.to === 'string' ? [] : [error('missing-property', `${path}/to`, '"to" must be a step id or null')]),
  ...conditions(value, path),
];

const step: Check = (value, path) => [
  ...text(value, 'id', path),
  ...list(value.fields, `${path}/fields`, 'a field object', field, true),
  ...conditions(value, path),
  ...list(value.routes, `${path}/routes`, 'a route object', route),
  ...['next', 'back', 'skip'].flatMap((name) => action(value[name], `${path}/${name}`)),
];

export function shapeIssues(input: unknown): DefinitionIssue[] {
  if (!isEntry(input)) return [error('invalid-type', '', 'the form definition must be an object')];
  return [
    ...list(input.fields, '/fields', 'a field object', field),
    ...list(input.steps, '/steps', 'a step object', step),
    ...action(input.submit, '/submit'),
    ...action(input.cancel, '/cancel'),
  ];
}

export function metaIssues(input: Entry): DefinitionIssue[] {
  return [
    ...text(input, 'id', ''),
    ...(typeof input.title === 'string' ? [] : [warning('missing-property', '/title', '"title" must be a string', 'Add a title for host UI and editors')]),
    ...(isEntry(input.submit) ? [] : [error('missing-property', '/submit', 'the submit action is missing', 'Add "submit": { "label": "Submit" }')]),
  ];
}
