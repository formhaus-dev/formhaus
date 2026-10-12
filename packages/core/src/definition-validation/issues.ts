export type DefinitionIssueCode =
  | 'invalid-type'
  | 'missing-property'
  | 'fields-and-steps'
  | 'duplicate-step-id'
  | 'duplicate-key'
  | 'reserved-key'
  | 'route-target'
  | 'unknown-field'
  | 'forward-reference'
  | 'condition-operator-count'
  | 'unknown-operator'
  | 'condition-value-mismatch'
  | 'condition-cycle'
  | 'invalid-pattern'
  | 'invalid-range'
  | 'rule-not-applicable'
  | 'missing-options'
  | 'default-not-in-options'
  | 'unknown-field-type'
  | 'unknown-validator'
  | 'skip-unreachable'
  | 'route-fallthrough';

export interface DefinitionIssue {
  code: DefinitionIssueCode;
  severity: 'error' | 'warning';
  path: string;
  message: string;
  hint?: string;
}

export class FormDefinitionError extends Error {
  readonly issues: DefinitionIssue[];

  constructor(issues: DefinitionIssue[]) {
    super(`Invalid form definition:\n${issues.map((issue) => issue.message).join('\n')}`);
    this.name = 'FormDefinitionError';
    this.issues = issues;
  }
}

function create(severity: DefinitionIssue['severity']) {
  return (code: DefinitionIssueCode, path: string, problem: string, hint?: string): DefinitionIssue => ({
    code,
    severity,
    path,
    message: `${path || '/'}: ${problem}.${hint ? ` ${hint}.` : ''}`,
    ...(hint && { hint: `${hint}.` }),
  });
}

export const error = create('error');
export const warning = create('warning');

export function isError(issue: DefinitionIssue): boolean {
  return issue.severity === 'error';
}

export function oneOf(values: string[]): string {
  if (values.length === 1) return `Use ${JSON.stringify(values[0])}`;
  const shown = values.slice(0, 10).map((value) => JSON.stringify(value)).join(', ');
  return values.length > 10 ? `Use one of: ${shown}, ...` : `Use one of: ${shown}`;
}

function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
}

export function closest(value: string, candidates: string[]): string | undefined {
  const lower = value.toLowerCase();
  return candidates.find((candidate) => candidate !== value && distance(lower, candidate.toLowerCase()) <= (candidate.length > 4 ? 2 : 1));
}

export function suggest(value: string, candidates: string[]): string | undefined {
  const match = closest(value, candidates);
  if (match !== undefined) return `Use ${JSON.stringify(match)}`;
  return candidates.length ? oneOf(candidates) : undefined;
}
