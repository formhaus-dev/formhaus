import { closest, type DefinitionIssue } from '../definition-validation/issues';
import { at, type DefinitionFix, type Entry, fix, isEntry, keysOf, list, quote, text } from './walk';

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
  const keys = (fields: unknown, step: number): Key[] =>
    list(fields).flatMap((field) => {
      if (!isEntry(field) || field.type === 'group') return [];
      const own = field.type !== 'section' && typeof field.key === 'string' ? [{ key: field.key, step }] : [];
      return [...own, ...keys(field.fields, step)];
    });
  return [
    ...keys(definition.fields, -1),
    ...list(definition.steps).flatMap((step, index) => keys(isEntry(step) ? step.fields : undefined, index)),
  ];
}

function grouped(definition: Entry, path: string): boolean {
  const parts = path.split('/');
  return parts.some(
    (_, index) =>
      parts[index - 1] === 'fields' && (at(definition, parts.slice(0, index + 1).join('/')) as Entry | undefined)?.type === 'group',
  );
}

function fieldScope(definition: Entry, path: string): string[] {
  const keys = keysByStep(definition);
  const own = /^(.*\/fields\/\d+)\/(show|showAny|validation|optionsDependsOn)\//.exec(path)?.[1];
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
  const all = kind === 'field' ? keysOf(definition) : stepStrings(definition);
  const scope = kind === 'field' ? fieldScope(definition, issue.path) : stepScope(definition, issue.path);
  const loose = kind === 'field' && grouped(definition, issue.path);
  const { match, safe } = repair(value, all, loose ? all : scope);
  return match === undefined
    ? []
    : [fix(`Use the ${kind} ${quote(match)}`, safe && !loose, { op: 'replace', path: issue.path, value: match })];
}

const stepStrings = (definition: Entry) =>
  list(definition.steps).flatMap((step) => (isEntry(step) && typeof step.id === 'string' ? [step.id] : []));
