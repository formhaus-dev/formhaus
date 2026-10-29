import type { IssueTexts } from './texts';

export type DefinitionIssueCode =
  | 'invalid-type'
  | 'missing-property'
  | 'missing-label'
  | 'unknown-property'
  | 'fields-and-steps'
  | 'duplicate-step-id'
  | 'duplicate-key'
  | 'duplicate-option-value'
  | 'reserved-key'
  | 'route-target'
  | 'unknown-field'
  | 'group-scope'
  | 'invalid-nesting'
  | 'outdated-format-version'
  | 'forward-reference'
  | 'unknown-recall-field'
  | 'recall-forward-reference'
  | 'recall-syntax'
  | 'recall-sensitive-field'
  | 'recall-query-source'
  | 'recall-untrusted-source'
  | 'condition-operator-count'
  | 'unknown-operator'
  | 'condition-value-mismatch'
  | 'contains-not-list'
  | 'contains-not-in-options'
  | 'condition-cycle'
  | 'condition-always-true'
  | 'invalid-pattern'
  | 'slow-pattern'
  | 'min-greater-than-max'
  | 'default-items-greater-than-max'
  | 'group-item-limit'
  | 'invalid-columns'
  | 'invalid-scale'
  | 'rule-not-applicable'
  | 'disabled-not-applicable'
  | 'missing-options'
  | 'default-not-in-options'
  | 'unknown-field-type'
  | 'custom-type-name'
  | 'definition-reset'
  | 'missing-component'
  | 'legacy-layout'
  | 'missing-research'
  | 'unknown-validator'
  | 'skip-unreachable'
  | 'route-fallthrough'
  | 'unsupported-format-version'
  | 'i18n-key-without-text'
  | 'unknown-i18n-slot'
  | 'unknown-message-key'
  | 'unknown-label-key'
  | 'i18n-unsafe-identifier'
  | 'unknown-source'
  | 'source-not-applicable'
  | 'columns-not-applicable'
  | 'unknown-autocomplete-token'
  | 'autocomplete-not-applicable'
  | 'unsafe-image-url'
  | 'exclusive-not-applicable'
  | 'exclusive-option-position'
  | 'exclusive-default-value'
  | 'exclusive-with-min-length'
  | 'randomize-not-applicable'
  | 'multiple-not-applicable'
  | 'matrix-options-mismatch';

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

export type IssueText = readonly [problem: string, hint?: string];

let active: IssueTexts | undefined;

export function withTexts<T>(texts: IssueTexts, run: () => T): T {
  const previous = active;
  active = texts;
  try {
    return run();
  } finally {
    active = previous;
  }
}

const sentence = (text: string) => (text.endsWith('?') ? text : `${text}.`);

function issue(
  code: DefinitionIssueCode,
  severity: DefinitionIssue['severity'],
  path: string,
  problem: string,
  hint?: string,
): DefinitionIssue {
  return {
    code,
    severity,
    path,
    message: `${path || '/'}: ${problem}.${hint ? ` ${sentence(hint)}` : ''}`,
    ...(hint && { hint: sentence(hint) }),
  };
}

export function error<C extends keyof IssueTexts>(code: C, path: string, ...params: Parameters<IssueTexts[C]>): DefinitionIssue {
  const describe = active?.[code] as ((...params: unknown[]) => IssueText) | undefined;
  return describe
    ? issue(code, 'error', path, ...describe(...params))
    : { code, severity: 'error', path, message: `${path || '/'}: ${code}` };
}

export function warning(code: DefinitionIssueCode, path: string, problem: string, hint?: string): DefinitionIssue {
  return issue(code, 'warning', path, problem, hint);
}

export function pointer(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

export function isError(issue: DefinitionIssue): boolean {
  return issue.severity === 'error';
}

export function oneOf(values: string[]): string {
  if (values.length === 1) return `Use ${JSON.stringify(values[0])}`;
  const shown = values
    .slice(0, 10)
    .map((value) => JSON.stringify(value))
    .join(', ');
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
