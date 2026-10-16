import type { DefinitionIssue } from '../definition-validation/issues';
import type { FormDefinition } from '../types';

export function warnDefinitionReset(
  previous: FormDefinition,
  next: FormDefinition,
  keep: string,
  onWarning?: (issue: DefinitionIssue) => void,
): boolean {
  let issue: DefinitionIssue | undefined;
  try {
    if (JSON.stringify(previous) === JSON.stringify(next)) {
      const hint = `Keep the definition in ${keep}.`;
      const message = `The form got a new definition object with the same content and was reset. ${hint}`;
      issue = { code: 'definition-reset', severity: 'warning', path: '', message, hint };
    }
  } catch {}
  if (!issue) return false;
  if (onWarning) onWarning(issue);
  else console.warn(`[formhaus] ${issue.message}`);
  return true;
}
