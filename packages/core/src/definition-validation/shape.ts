import type { DefinitionIssue } from './issues';
import { formatIssues } from './format';
import { error, pointer } from './issues';
import type { Expected } from './texts';
import { isEntry } from '../visibility/nodes';
import { isPlainEntry } from '../validation/type-checks';

export { isEntry };

export const nestable = (path: string) => path.split('/fields/').length <= 3;

type Entry = Record<string, unknown>;
type Check = (value: Entry, path: string) => DefinitionIssue[];
type Kind = 'string' | 'number' | 'boolean' | 'requirement' | 'scalar' | 'list';

const KINDS: Record<Kind, (value: unknown) => boolean> = {
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' && Number.isFinite(value),
  boolean: (value) => typeof value === 'boolean',
  requirement: (value) => ['boolean', 'string'].includes(typeof value),
  scalar: (value) => ['string', 'number', 'boolean'].includes(typeof value),
  list: (value) => Array.isArray(value) && value.every((item) => ['string', 'number'].includes(typeof item)),
};

const invalid = (path: string, key: string, expected: Expected) => [error('invalid-type', `${path}/${pointer(key)}`, expected, key)];

function typed(value: Entry, rules: Record<string, Kind>, path: string): DefinitionIssue[] {
  return Object.entries(rules).flatMap(([key, kind]) =>
    value[key] === undefined || KINDS[kind](value[key]) ? [] : invalid(path, key, kind),
  );
}

function missing(path: string, key: string): DefinitionIssue {
  return error('missing-property', path, key);
}

function list(value: unknown, path: string, expected: Expected, check: Check, required = false): DefinitionIssue[] {
  if (value == null && !required) return [];
  if (value === undefined) return [missing(path.slice(0, path.lastIndexOf('/')), path.slice(path.lastIndexOf('/') + 1))];
  if (!Array.isArray(value)) return [error('invalid-type', path, required ? 'items' : 'array')];
  return value.flatMap((item, index) =>
    isEntry(item) ? check(item, `${path}/${index}`) : [error('invalid-type', `${path}/${index}`, expected)],
  );
}

function text(value: Entry, key: string, path: string): DefinitionIssue[] {
  if (value[key] === undefined) return [missing(path, key)];
  return typeof value[key] === 'string' ? [] : invalid(path, key, 'string');
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
      contains: 'scalar',
      notContains: 'scalar',
      notEmpty: 'boolean',
      gt: 'number',
      gte: 'number',
      lt: 'number',
      lte: 'number',
    },
    path,
  );

function conditions(value: Entry, path: string): DefinitionIssue[] {
  return [...list(value.show, `${path}/show`, 'condition', condition), ...list(value.showAny, `${path}/showAny`, 'condition', condition)];
}

function action(value: unknown, path: string): DefinitionIssue[] {
  if (!isEntry(value)) return [];
  return [...typed(value, { label: 'string' }, path), ...list(value.disabled, `${path}/disabled`, 'condition', condition)];
}

const option: Check = (value, path) => [
  ...text(value, 'value', path),
  ...typed(value, { label: 'string', image: 'string', exclusive: 'boolean', pinned: 'boolean' }, path),
];

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
  return isEntry(value) ? typed(value, RULES, path) : [error('invalid-type', path, 'rules')];
}

function props(value: unknown, path: string): DefinitionIssue[] {
  return value === undefined || isPlainEntry(value) ? [] : [error('invalid-type', path, 'object')];
}

function dependencies(value: unknown, path: string): DefinitionIssue[] {
  const valid = value === undefined || (Array.isArray(value) && value.every((key) => typeof key === 'string'));
  return valid ? [] : [error('invalid-type', path, 'keys')];
}

function columns(value: unknown, path: string): DefinitionIssue[] {
  if (value === undefined || (Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 4)) return [];
  return [error(typeof value === 'number' ? 'invalid-columns' : 'invalid-type', path, 'columns', 'columns')];
}

const field: Check = (value, path) => {
  const container = (value.type === 'section' || value.type === 'group') && nestable(path);
  return [
    ...text(value, 'key', path),
    ...text(value, 'type', path),
    ...typed(
      value,
      {
        label: 'string',
        placeholder: 'string',
        autocomplete: 'string',
        helperText: 'string',
        title: 'string',
        description: 'string',
        itemLabel: 'string',
        addLabel: 'string',
        removeLabel: 'string',
        defaultItems: 'number',
        randomize: 'boolean',
      },
      path,
    ),
    ...(container ? list(value.fields, `${path}/fields`, 'field', field, true) : []),
    ...conditions(value, path),
    ...list(value.options, `${path}/options`, 'option', option),
    ...validation(value.validation, `${path}/validation`),
    ...dependencies(value.optionsDependsOn, `${path}/optionsDependsOn`),
    ...props(value.props, `${path}/props`),
    ...columns(value.columns, `${path}/columns`),
  ];
};

const route: Check = (value, path) => [
  ...(value.to === undefined
    ? [missing(path, 'to')]
    : value.to === null || typeof value.to === 'string'
      ? []
      : invalid(path, 'to', 'target')),
  ...conditions(value, path),
];

const step: Check = (value, path) => [
  ...text(value, 'id', path),
  ...typed(value, { title: 'string', description: 'string' }, path),
  ...list(value.fields, `${path}/fields`, 'field', field, true),
  ...conditions(value, path),
  ...list(value.routes, `${path}/routes`, 'route', route),
  ...['next', 'back', 'skip'].flatMap((name) => action(value[name], `${path}/${name}`)),
];

export function shapeIssues(input: unknown): DefinitionIssue[] {
  if (!isEntry(input)) return [error('invalid-type', '', 'definition')];
  const format = formatIssues(input);
  if (format.length) return format;
  return [
    ...list(input.fields, '/fields', 'field', field),
    ...list(input.steps, '/steps', 'step', step),
    ...action(input.submit, '/submit'),
    ...action(input.cancel, '/cancel'),
  ];
}

export function metaIssues(input: Entry): DefinitionIssue[] {
  return [
    ...text(input, 'id', ''),
    ...(input.submit === undefined ? [missing('', 'submit')] : isEntry(input.submit) ? [] : [error('invalid-type', '/submit', 'action')]),
  ];
}
