import { checkDefinition, FormDefinitionError, type DefinitionIssue } from '../definition-validation';
import { definitionErrors } from '../definition-validation/check-definition';
import { isError } from '../definition-validation/issues';
import type { FormDefinition } from '../types';
import type { FormEngineOptions } from './engine-options';

function developmentIssues(definition: FormDefinition, validators: Record<string, unknown>): DefinitionIssue[] | undefined {
  let check: (() => DefinitionIssue[]) | undefined;
  try {
    if (process.env.NODE_ENV !== 'production') check = () => checkDefinition(definition, { validators });
  } catch {}
  return check?.();
}

const parsed = new WeakSet<FormDefinition>();

export function trustDefinition(definition: FormDefinition): FormDefinition {
  parsed.add(definition);
  return definition;
}

export function assertDefinition(definition: FormDefinition, options: FormEngineOptions, validators: Record<string, unknown>): void {
  if (parsed.has(definition)) return;
  const issues = developmentIssues(definition, validators) ?? definitionErrors(definition);
  const errors = issues.filter(isError);
  if (errors.length) throw new FormDefinitionError(errors);
  const warn = options.onWarning ?? ((issue: DefinitionIssue) => console.warn(`[formhaus] ${issue.message}`));
  for (const issue of issues) warn(issue);
}
