import type { DefinitionIssue } from '@formhaus/core';

export interface Issue {
  code: string;
  severity: 'error' | 'warning';
  path: string;
  message: string;
  hint?: string;
}

export function issue(code: string, severity: Issue['severity'], path: string, problem: string, hint?: string): Issue {
  return { code, severity, path, message: `${path || '/'}: ${problem}.${hint ? ` ${hint}.` : ''}`, ...(hint && { hint: `${hint}.` }) };
}

export function fromCore(issues: DefinitionIssue[]): Issue[] {
  return issues.map(({ code, severity, path, message, hint }) => ({ code, severity, path, message, ...(hint && { hint }) }));
}

export function ordered(issues: Issue[]): Issue[] {
  const seen = new Set<string>();
  const unique = issues.filter(({ message }) => !seen.has(message) && seen.add(message));
  return [...unique.filter(({ severity }) => severity === 'error'), ...unique.filter(({ severity }) => severity === 'warning')];
}
