import type { DefinitionIssue } from './issues';
import { formatIssues } from './format';
import { error, pointer } from './issues';

type Entry = Record<string, unknown>;
type Check = (value: Entry, path: string) => DefinitionIssue[];
type Kind = 'string' | 'number' | 'boolean' | 'requirement' | 'scalar' | 'list';

export const isEntry = (value: unknown): value is Entry => typeof value === 'object' && value !== null && !Array.isArray(value);

const KINDS: Record<Kind, [(value: unknown) => boolean, string]> = {
  string: [(value) => typeof value === 'string', 'a string'],
  number: [(value) => typeof value === 'number' && Number.isFinite(value), 'a number'],
  boolean: [(value) => typeof value === 'boolean', 'true or false'],
  requirement: [(value) => ['boolean', 'string'].includes(typeof value), 'true, false or a message string'],
  scalar: [(value) => ['string', 'number', 'boolean'].includes(typeof value), 'a string, number or boolean'],
  list: [
    (value) => Array.isArray(value) && value.every((item) => ['string', 'number'].includes(typeof item)),
    'an array of strings or numbers',
  ],
};

function typed(value: Entry, rules: Record<string, Kind>, path: string): DefinitionIssue[] {
  return Object.entries(rules).flatMap(([key, kind]) => {
    const [valid, name] = KINDS[kind];
    return value[key] === undefined || valid(value[key])
      ? []
      : [error('invalid-type', `${path}/${pointer(key)}`, `"${key}" must be ${name}`)];
  });
}

function list(value: unknown, path: string, name: string, check: Check, required = false): DefinitionIssue[] {
  if (value == null && !required) return [];
  if (!Array.isArray(value))
    return [error('invalid-type', path, 'must be an array', required ? 'Use [] when there is nothing to list' : undefined)];
  return value.flatMap((item, index) =>
    isEntry(item) ? check(item, `${path}/${index}`) : [error('invalid-type', `${path}/${index}`, `must be ${name}`)],
  );
}

function text(value: Entry, key: string, path: string): DefinitionIssue[] {
  return typeof value[key] === 'string' ? [] : [error('missing-property', `${path}/${key}`, `"${key}" must be a string`)];
}

const condition: Check = (value, path) =>
  typed(
    value,
    {
      field: 'string',
      eq: 'scalar',
      neq: 'scalar',
      in: 'list',
      notIn: 'list',
      notEmpty: 'boolean',
      gt: 'number',
      gte: 'number',
      lt: 'number',
      lte: 'number',
    },
    path,
  );

function conditions(value: Entry, path: string): DefinitionIssue[] {
  return [
    ...list(value.show, `${path}/show`, 'a condition object', condition),
    ...list(value.showAny, `${path}/showAny`, 'a condition object', condition),
  ];
}

function action(value: unknown, path: string): DefinitionIssue[] {
  if (!isEntry(value)) return [];
  return [...typed(value, { label: 'string' }, path), ...list(value.disabled, `${path}/disabled`, 'a condition object', condition)];
}

const option: Check = (value, path) => [...text(value, 'value', path), ...typed(value, { label: 'string' }, path)];

const RULES: Record<string, Kind> = {
  required: 'requirement',
  minLength: 'number',
  maxLength: 'number',
  min: 'number',
  max: 'number',
  pattern: 'string',
  matchField: 'string',
  validator: 'string',
  minLengthMessage: 'string',
  maxLengthMessage: 'string',
  minMessage: 'string',
  maxMessage: 'string',
  patternMessage: 'string',
  matchFieldMessage: 'string',
};

function validation(value: unknown, path: string): DefinitionIssue[] {
  if (value === undefined) return [];
  return isEntry(value) ? typed(value, RULES, path) : [error('invalid-type', path, 'must be an object of validation rules')];
}

function dependencies(value: unknown, path: string): DefinitionIssue[] {
  const valid = value === undefined || (Array.isArray(value) && value.every((key) => typeof key === 'string'));
  return valid ? [] : [error('invalid-type', path, 'must be an array of field keys')];
}

const field: Check = (value, path) => [
  ...text(value, 'key', path),
  ...text(value, 'type', path),
  ...typed(value, { label: 'string', placeholder: 'string', helperText: 'string' }, path),
  ...conditions(value, path),
  ...list(value.options, `${path}/options`, 'an option object', option),
  ...validation(value.validation, `${path}/validation`),
  ...dependencies(value.optionsDependsOn, `${path}/optionsDependsOn`),
];

const route: Check = (value, path) => [
  ...(value.to === null || typeof value.to === 'string' ? [] : [error('missing-property', `${path}/to`, '"to" must be a step id or null')]),
  ...conditions(value, path),
];

const step: Check = (value, path) => [
  ...text(value, 'id', path),
  ...typed(value, { title: 'string', description: 'string' }, path),
  ...list(value.fields, `${path}/fields`, 'a field object', field, true),
  ...conditions(value, path),
  ...list(value.routes, `${path}/routes`, 'a route object', route),
  ...['next', 'back', 'skip'].flatMap((name) => action(value[name], `${path}/${name}`)),
];

export function shapeIssues(input: unknown): DefinitionIssue[] {
  if (!isEntry(input)) return [error('invalid-type', '', 'the form definition must be an object')];
  const format = formatIssues(input);
  if (format.length) return format;
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
    ...(isEntry(input.submit)
      ? []
      : [error('missing-property', '/submit', 'the submit action is missing', 'Add "submit": { "label": "Submit" }')]),
  ];
}
