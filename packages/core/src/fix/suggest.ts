import { checkDefinition } from '../definition-validation/check-definition';
import type { DefinitionIssue } from '../definition-validation/issues';
import { applyFix } from './patch';
import { fixesFor } from './rules';
import { type DefinitionFix, isEntry } from './walk';

export type { DefinitionFix } from './walk';

export interface FixableIssue extends DefinitionIssue {
  fixes?: DefinitionFix[];
}

export interface AppliedFix extends DefinitionFix {
  code: DefinitionIssue['code'];
  path: string;
}

export interface FixAllResult<T> {
  definition: T;
  applied: AppliedFix[];
  issues: FixableIssue[];
}

function attempt(definition: Record<string, unknown>, issue: DefinitionIssue, issues: readonly DefinitionIssue[]): DefinitionFix[] {
  try {
    return fixesFor(definition, issue, issues);
  } catch {
    return [];
  }
}

export function suggestFixes(definition: unknown, issues?: readonly DefinitionIssue[]): FixableIssue[] {
  const found = issues ?? checkDefinition(definition);
  if (!isEntry(definition)) return found.map((issue) => ({ ...issue }));
  return found.map((issue) => {
    const fixes = attempt(definition, issue, found);
    return fixes.length ? { ...issue, fixes } : { ...issue };
  });
}

export function fixAll<T>(definition: T, limit = 500): FixAllResult<T> {
  let current = definition;
  const applied: AppliedFix[] = [];
  const tried = new Set<string>();
  for (let round = 0; round < limit; round++) {
    const next = suggestFixes(current)
      .flatMap(({ code, path, fixes = [] }) => fixes.map((item) => ({ ...item, code, path })))
      .find((item) => item.safe && !tried.has(JSON.stringify(item.patch)));
    if (!next) break;
    tried.add(JSON.stringify(next.patch));
    try {
      current = applyFix(current, next.patch);
      applied.push(next);
    } catch {}
  }
  return { definition: current, applied, issues: suggestFixes(current) };
}
