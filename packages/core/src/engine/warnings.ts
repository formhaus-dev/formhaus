import { checkDefinition, FormDefinitionError, type DefinitionIssue } from '../definition-validation';
import { definitionErrors } from '../definition-validation/check-definition';
import { isError } from '../definition-validation/issues';
import type { FormDefinition } from '../types';
import { isGroup } from '../visibility/nodes';
import { getAllFields } from './engine-utils';
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

let unordered = false;

const randomized = (definition: FormDefinition) =>
  getAllFields(definition).some((field) => field.randomize || (isGroup(field) && field.fields.some((item) => item.randomize)));

export function warnUnordered(definition: FormDefinition, { research }: FormEngineOptions): void {
  let warn: (() => void) | undefined;
  try {
    if (process.env.NODE_ENV !== 'production')
      warn = () => {
        if (unordered || research || !randomized(definition)) return;
        unordered = true;
        console.warn(
          '[formhaus] "randomize" needs the research module, so the options show in written order. Pass research from @formhaus/core/research.',
        );
      };
  } catch {}
  warn?.();
}
