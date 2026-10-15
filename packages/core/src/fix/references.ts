import { closest, type DefinitionIssue } from '../definition-validation/issues';
import { at, type DefinitionFix, type Entry, fix, isEntry, list, quote, text } from './walk';

export function typoDistance(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  const rows = Array.from({ length: x.length + 1 }, (_, i) => Array.from({ length: y.length + 1 }, (_, j) => (i ? (j ? 0 : i) : j)));
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  }
  return rows[x.length][y.length];
}

interface Key {
  key: string;
  step: number;
}

function keysByStep(definition: Entry): Key[] {
  const keys = (fields: unknown, step: number) =>
    list(fields).flatMap((field) => (isEntry(field) && typeof field.key === 'string' ? [{ key: field.key, step }] : []));
  return [
    ...keys(definition.fields, -1),
    ...list(definition.steps).flatMap((step, index) => keys(isEntry(step) ? step.fields : undefined, index)),
  ];
}

function fieldScope(definition: Entry, path: string): string[] {
  const keys = keysByStep(definition);
  const own = /^(\/steps\/\d+)?\/fields\/\d+/.exec(path)?.[0];
  const self = own ? text((at(definition, own) as Entry | undefined)?.key) : undefined;
  const others = keys.filter(({ key }) => key !== self);
  const step = Number(/^\/steps\/(\d+)/.exec(path)?.[1] ?? -1);
  if (step < 0 || !/\/(show|showAny)\/\d+\/field$/.test(path)) return others.map(({ key }) => key);
  const limit = own || /\/routes\//.test(path) ? step : step - 1;
  return others.filter((entry) => entry.step <= limit).map(({ key }) => key);
}

function stepScope(definition: Entry, path: string): string[] {
  const from = Number(/^\/steps\/(\d+)/.exec(path)?.[1] ?? -1);
  return list(definition.steps).flatMap((step, index) => (index > from && isEntry(step) && typeof step.id === 'string' ? [step.id] : []));
}

function repair(value: string, all: string[], scope: string[]): { match?: string; safe: boolean } {
  const near = [...new Set(all)].filter((candidate) => candidate !== value && typoDistance(value, candidate) <= 2);
  const typos = near.filter((candidate) => typoDistance(value, candidate) <= 1);
  if (typos.length === 1 && near.length === 1 && scope.includes(typos[0])) return { match: typos[0], safe: true };
  return { match: closest(value, scope), safe: false };
}

export function referenceFixes(definition: Entry, issue: DefinitionIssue, kind: 'field' | 'step'): DefinitionFix[] {
  const value = text(at(definition, issue.path));
  if (value === undefined) return [];
  const all = kind === 'field' ? keysByStep(definition).map(({ key }) => key) : stepStrings(definition);
  const scope = kind === 'field' ? fieldScope(definition, issue.path) : stepScope(definition, issue.path);
  const { match, safe } = repair(value, all, scope);
  return match === undefined ? [] : [fix(`Use the ${kind} ${quote(match)}`, safe, { op: 'replace', path: issue.path, value: match })];
}

const stepStrings = (definition: Entry) =>
  list(definition.steps).flatMap((step) => (isEntry(step) && typeof step.id === 'string' ? [step.id] : []));
