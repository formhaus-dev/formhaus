import type { DefinitionIssue } from '../definition-validation';

function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
}

export function warnInDevelopment(issue: DefinitionIssue): void {
  if (!isProduction()) console.warn(`[formhaus] ${issue.message}`);
}
