import { FORMAT_VERSION } from '../definition-validation/format';
import { closest, type DefinitionIssue } from '../definition-validation/issues';
import { BUILT_IN_TYPES } from '../validation/type-checks';
import { CONDITION_OPERATORS } from '../visibility/evaluate-condition';
import { camel, humanize, slug, unique } from './names';
import { referenceFixes } from './references';
import {
  at,
  child,
  conditionValues,
  type DefinitionFix,
  type Entry,
  fix,
  keysOf,
  last,
  missingName,
  parent,
  quote,
  references,
  set,
  stepIds,
  suggestedName,
  text,
  valuesOf,
} from './walk';
import { isEntry } from '../visibility/nodes';

const STEP = /^\/steps\/\d+$/;
const FIELD = /\/fields\/\d+$/;
const OPTION = /\/options\/\d+$/;
const ACTION = /^(\/steps\/\d+)?\/(submit|cancel|next|back|skip)$/;
const ACTION_LABELS: Record<string, string> = { submit: 'Submit', cancel: 'Cancel', next: 'Continue', back: 'Back', skip: 'Skip' };

function rename(from: string, to: string): DefinitionFix {
  return fix(`Rename "${last(from)}" to "${last(to)}"`, true, { op: 'move', from, path: to });
}

function actionLabel(definition: Entry, owner: string): DefinitionFix[] {
  const name = last(owner);
  const label = ACTION_LABELS[name];
  const catalog = name === 'next' || name === 'back' ? definition.labels !== undefined || definition.lang !== undefined : name === 'cancel';
  return label ? [fix(`Set the label to ${quote(label)}`, !catalog, set(`${owner}/label`, label))] : [];
}

function missing(definition: Entry, owner: string, name: string | undefined, issues: readonly DefinitionIssue[]): DefinitionFix[] {
  const target = at(definition, owner);
  if (name === undefined || !isEntry(target)) return [];
  const path = child(owner, name);
  const typo = issues.find((other) => other.code === 'unknown-property' && parent(other.path) === owner && suggestedName(other) === name);
  if (typo) return [rename(typo.path, path)];
  if (name === 'submit' && owner === '') return [fix('Add a submit button labeled "Submit"', true, set(path, { label: 'Submit' }))];
  if (name === 'id' && (owner === '' || STEP.test(owner))) {
    const id = unique(slug(target.title, owner ? `step-${Number(last(owner)) + 1}` : 'my-form'), owner ? stepIds(definition) : [], '-');
    return [fix(`Set the id to ${quote(id)}`, true, set(path, id))];
  }
  if (name === 'fields' && STEP.test(owner)) return [fix('Add an empty "fields" list', true, set(path, []))];
  if (name === 'key' && FIELD.test(owner)) {
    const key = unique(camel(target.label, 'field'), keysOf(definition));
    return [fix(`Set the key to ${quote(key)}`, true, set(path, key))];
  }
  if (name === 'value' && OPTION.test(owner)) {
    const value = unique(slug(target.label, `option-${Number(last(owner)) + 1}`), valuesOf(at(definition, parent(owner))), '-');
    return [fix(`Set the value to ${quote(value)}`, true, set(path, value))];
  }
  if (name !== 'label') return [];
  if (ACTION.test(owner)) return actionLabel(definition, owner);
  const source = FIELD.test(owner) ? text(target.key) : OPTION.test(owner) ? text(target.value) : undefined;
  return source ? [fix(`Set the label to ${quote(humanize(source))}`, true, set(path, humanize(source)))] : [];
}

function unknownProperty(definition: Entry, issue: DefinitionIssue): DefinitionFix[] {
  const owner = parent(issue.path);
  const name = last(issue.path);
  const match = suggestedName(issue);
  if (match !== undefined) return [rename(issue.path, child(owner, match))];
  if (!issue.hint?.startsWith('Move ')) return [];
  const rules = at(definition, `${owner}/validation`);
  if (rules !== undefined && (!isEntry(rules) || name in rules)) return [];
  const target = child(`${owner}/validation`, name);
  const move = { op: 'move' as const, from: issue.path, path: target };
  return [fix(`Move "${name}" into "validation"`, false, ...(rules === undefined ? [set(`${owner}/validation`, {}), move] : [move]))];
}

function duplicateKey(definition: Entry, { path }: DefinitionIssue): DefinitionFix[] {
  const key = text(at(definition, path));
  if (key === undefined) return [];
  const next = unique(key, keysOf(definition), '_');
  return [fix(`Rename the key to ${quote(next)}`, !references(definition).has(key), set(path, next))];
}

function duplicateOption(definition: Entry, { path }: DefinitionIssue): DefinitionFix[] {
  const value = text(at(definition, path));
  const options = parent(parent(path));
  const field = at(definition, parent(options));
  if (value === undefined || !isEntry(field)) return [];
  const next = unique(value, valuesOf(at(definition, options)), '_');
  const defaults = Array.isArray(field.defaultValue) ? field.defaultValue : [field.defaultValue];
  const used = defaults.includes(value) || (typeof field.key === 'string' && conditionValues(definition, field.key).includes(value));
  return [fix(`Change the value to ${quote(next)}`, !used, set(path, next))];
}

function duplicateStep(definition: Entry, { path }: DefinitionIssue): DefinitionFix[] {
  const id = text(at(definition, path));
  if (id === undefined) return [];
  const next = unique(id, stepIds(definition), '-');
  const routed = JSON.stringify(definition.steps).includes(`"to":${quote(id)}`);
  return [fix(`Rename the step id to ${quote(next)}`, !routed, set(path, next))];
}

function closestTo(definition: Entry, issue: DefinitionIssue, candidates: string[], noun: string): DefinitionFix[] {
  const value = text(at(definition, issue.path));
  const match = value === undefined ? undefined : closest(value, candidates);
  return match === undefined ? [] : [fix(`Use the ${noun} ${quote(match)}`, false, { op: 'replace', path: issue.path, value: match })];
}

function unknownOperator(definition: Entry, { path }: DefinitionIssue): DefinitionFix[] {
  const condition = at(definition, parent(path));
  const match = closest(last(path), [...CONDITION_OPERATORS]);
  if (match === undefined || !isEntry(condition) || match in condition) return [];
  return [{ ...rename(path, child(parent(path), match)), safe: false }];
}

function range(definition: Entry, { path }: DefinitionIssue): DefinitionFix[] {
  const rules = at(definition, parent(path));
  const low = last(path);
  const high = low === 'min' ? 'max' : 'maxLength';
  if (!isEntry(rules)) return [];
  const base = parent(path);
  return [fix(`Swap ${low} and ${high}`, false, set(`${base}/${low}`, rules[high]), set(`${base}/${high}`, rules[low]))];
}

function formatVersion(definition: Entry, future: boolean): DefinitionFix[] {
  const major = /^v?(\d+)(\.\d+)*$/i.exec(String(definition.formatVersion))?.[1];
  const safe = !future && major !== undefined && Number(major) === parseInt(FORMAT_VERSION, 10);
  return [fix(`Set formatVersion to ${quote(FORMAT_VERSION)}`, safe, { op: 'replace', path: '/formatVersion', value: FORMAT_VERSION })];
}

export function fixesFor(definition: Entry, issue: DefinitionIssue, issues: readonly DefinitionIssue[]): DefinitionFix[] {
  switch (issue.code) {
    case 'missing-property':
      return missing(definition, issue.path, missingName(issue), issues);
    case 'missing-label':
      return missing(definition, parent(issue.path), 'label', issues);
    case 'unknown-property':
      return unknownProperty(definition, issue);
    case 'duplicate-key':
      return duplicateKey(definition, issue);
    case 'duplicate-option-value':
      return duplicateOption(definition, issue);
    case 'duplicate-step-id':
      return duplicateStep(definition, issue);
    case 'unknown-field':
      return referenceFixes(definition, issue, 'field');
    case 'route-target':
      return referenceFixes(definition, issue, 'step');
    case 'unknown-field-type':
      return closestTo(definition, issue, BUILT_IN_TYPES, 'type');
    case 'unknown-operator':
      return unknownOperator(definition, issue);
    case 'min-greater-than-max':
      return range(definition, issue);
    case 'unsupported-format-version':
      return formatVersion(definition, true);
    case 'randomize-not-applicable':
    case 'multiple-not-applicable':
      return [fix(`Remove "${last(issue.path)}"`, true, { op: 'remove', path: issue.path })];
    case 'invalid-type':
      return issue.path === '/formatVersion' ? formatVersion(definition, false) : [];
    default:
      return [];
  }
}
