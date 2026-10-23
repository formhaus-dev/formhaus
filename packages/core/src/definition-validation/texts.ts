import { OPERATORS } from './conditions';
import type { ConditionEntry } from './context';
import { FORMAT_VERSION } from './format';
import { oneOf, suggest, type DefinitionIssueCode, type IssueText } from './issues';

const SUBMIT = 'Add "submit": { "label": "Submit" }';
const QUERY = 'Use { "query": "<parameter name>" } for a URL parameter';

const EXPECTED = {
  string: 'a string',
  number: 'a number',
  boolean: 'true or false',
  requirement: 'true, false or a message string',
  scalar: 'a string, number or boolean',
  list: 'an array of strings or numbers',
  array: 'an array',
  items: 'an array',
  condition: 'a condition object',
  field: 'a field object',
  option: 'an option object',
  route: 'a route object',
  step: 'a step object',
  rules: 'an object of validation rules',
  object: 'an object',
  definition: 'an object',
  keys: 'an array of field keys',
  columns: 'a whole number from 1 to 4',
  target: 'a step id or null',
  action: 'an action object',
  version: 'a version string',
  source: 'a source name or a query object',
  messages: 'an object of message templates',
  labels: 'an object of label templates',
  translations: 'an object of translation keys',
  text: 'a non-empty string',
};

export type Expected = keyof typeof EXPECTED;

const TYPE_HINTS: Partial<Record<Expected, string>> = {
  items: 'Use [] when there is nothing to list',
  action: SUBMIT,
  source: QUERY,
};

const MISSING_HINTS: Record<string, string | undefined> = { submit: SUBMIT, field: 'Add the key of the field to test' };

export const missingProperty = (key: string) => `missing required property "${key}"`;

function invalidType(expected: Expected, key?: string): IssueText {
  const subject = expected === 'definition' ? 'the form definition ' : key === undefined ? '' : `"${key}" `;
  return [`${subject}must be ${EXPECTED[expected]}`, expected === 'version' ? `Use "${FORMAT_VERSION}"` : TYPE_HINTS[expected]];
}

function forwardReference(field: string, owner: ConditionEntry['owner']): IssueText {
  const step = owner === 'step';
  const name = owner === 'route' ? 'Route' : step ? 'Step' : 'Field';
  return [
    `"${field}" belongs to ${step ? 'this or a later step' : 'a later step'}`,
    `${name} conditions can use fields of ${step ? 'earlier steps' : 'this or an earlier step'}`,
  ];
}

function duplicateKey(key: string, other: string, clash: 'path' | 'group' | 'prefix'): IssueText {
  if (clash === 'prefix') return [`key "${key}" starts with the group key "${other}."`, 'Rename the field'];
  return clash === 'path'
    ? [
        `key "${key}" is already used by ${other} on the same path`,
        'Rename one of the fields, or move them to route branches that never meet',
      ]
    : [`key "${key}" is already used by ${other}`, 'Rename the field'];
}

export const ISSUE_TEXTS = {
  'invalid-type': invalidType,
  'invalid-columns': invalidType,
  'missing-property': (key: string): IssueText => [missingProperty(key), MISSING_HINTS[key]],
  'fields-and-steps': (): IssueText => [
    'the definition has both "fields" and "steps"',
    'Move the top-level fields into a step, or remove "steps"',
  ],
  'duplicate-step-id': (id: string, first: number): IssueText => [
    `step id "${id}" is already used by /steps/${first}`,
    'Give each step a unique id',
  ],
  'route-target': (to: string, later: string[], known: boolean): IssueText => [
    `"${to}" is not a ${known ? 'later step' : 'step id'}`,
    later.length ? `${oneOf(later)}, or null to end the form here` : 'Use null to end the form here',
  ],
  'reserved-key': (key: string): IssueText => [`"${key}" is a built-in object property name`, 'Rename the field key'],
  'duplicate-key': duplicateKey,
  'invalid-nesting': (type: string, parent: string): IssueText => [
    `a ${type} cannot be inside a ${parent}`,
    'Move it to the fields of the step',
  ],
  'unknown-operator': (key: string): IssueText => [`"${key}" is not a condition operator`, suggest(key, [...OPERATORS])],
  'condition-operator-count': (count: number): IssueText => [
    count ? `the condition has ${count} operators` : 'the condition has no operator',
    `Use exactly one of: ${OPERATORS.join(', ')}`,
  ],
  'group-scope': (name: string, group: string): IssueText => [
    `"${name}" is a field inside the group "${group}"`,
    'Only fields of the same group can use it',
  ],
  'unknown-field': (name: string, candidates: string[]): IssueText => [`"${name}" is not a field key`, suggest(name, candidates)],
  'forward-reference': forwardReference,
  'condition-cycle': (cycle: string[]): IssueText => [
    `show conditions form a cycle: ${cycle.join(' -> ')}`,
    'Remove one of the conditions in the cycle',
  ],
  'min-greater-than-max': (min: string, low: number, max: string, high: number): IssueText => [
    `${min} (${low}) is greater than ${max} (${high})`,
    `Lower ${min} or raise ${max}`,
  ],
  'invalid-pattern': (pattern: string): IssueText => [
    `${JSON.stringify(pattern)} is not a valid regular expression`,
    'Fix the pattern or escape special characters with a backslash',
  ],
  'invalid-scale': (): IssueText => ['a scale needs 2 to 11 whole-number points'],
  'default-items-greater-than-max': (items: number, max: number): IssueText => [
    `defaultItems (${items}) is greater than maxLength (${max})`,
    'Lower defaultItems or raise maxLength',
  ],
  'duplicate-option-value': (value: string): IssueText => [`"${value}" is already an option value`],
  'unsupported-format-version': (version: string): IssueText => [`format ${version} is not supported`, 'Upgrade @formhaus/core'],
  'unknown-source': (source: string, names: string[]): IssueText => [
    `"${source}" is not a source`,
    source === 'query' ? QUERY : suggest(source, names),
  ],
  'i18n-key-without-text': (slot: string): IssueText => [
    `"${slot}" has a translation key but no source text`,
    `Add "${slot}" as the fallback text`,
  ],
} satisfies Partial<Record<DefinitionIssueCode, (...params: never[]) => IssueText>>;

export type IssueTexts = typeof ISSUE_TEXTS;
