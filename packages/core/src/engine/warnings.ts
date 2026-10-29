import { checkDefinition, FormDefinitionError, type DefinitionIssue } from '../definition-validation';
import { definitionErrors, parsed } from '../definition-validation/check-definition';
import { isError } from '../definition-validation/issues';
import type { FormDefinition, LocaleSource } from '../types';
import { untranslated } from '../i18n/catalog';
import { isGroup } from '../visibility/nodes';
import { getAllFields } from './engine-utils';
import type { FormEngineOptions } from './engine-options';

function definitionIssues(definition: FormDefinition, validators: Record<string, unknown>): DefinitionIssue[] {
  let check: (() => DefinitionIssue[]) | undefined;
  try {
    if (process.env.NODE_ENV !== 'production') check = () => checkDefinition(definition, { validators });
    else if (process.env.FORMHAUS_TRUSTED !== '1') throw definition;
  } catch {
    if (!parsed.has(definition)) return definitionErrors(definition);
  }
  return check?.() ?? [];
}

export function trustDefinition(definition: FormDefinition): FormDefinition {
  parsed.set(definition, true);
  return definition;
}

const reporter = ({ onWarning }: FormEngineOptions) =>
  onWarning ?? ((issue: DefinitionIssue) => console.warn(`[formhaus] ${issue.message}`));

export function assertDefinition(definition: FormDefinition, options: FormEngineOptions, validators: Record<string, unknown>): void {
  if (parsed.get(definition)) return;
  const issues = definitionIssues(definition, validators);
  const errors = issues.filter(isError);
  if (errors.length) throw new FormDefinitionError(errors);
  const warn = reporter(options);
  for (const issue of issues) warn(issue);
}

let unordered = false;

const randomized = (definition: FormDefinition) =>
  getAllFields(definition).some((field) => field.randomize || (isGroup(field) && field.fields.some((item) => item.randomize)));

export function warnUnordered(definition: FormDefinition, options: FormEngineOptions): void {
  let warn: (() => void) | undefined;
  try {
    if (process.env.NODE_ENV !== 'production')
      warn = () => {
        if (unordered || options.research || !randomized(definition)) return;
        unordered = true;
        const hint = 'Pass research from @formhaus/core/research.';
        const message = `"randomize" needs the research module, so the options show in written order. ${hint}`;
        reporter(options)({
          code: 'missing-research',
          severity: 'warning',
          path: '',
          message,
          hint,
        });
      };
  } catch {}
  warn?.();
}

export function warnUntranslated(sources: LocaleSource[], options: FormEngineOptions): void {
  let warn: (() => void) | undefined;
  try {
    if (process.env.NODE_ENV !== 'production')
      warn = () => {
        if (!untranslated(sources)) return;
        const hint = 'Pass it through translation() from @formhaus/core/i18n.';
        reporter(options)({
          code: 'untranslated-locale',
          severity: 'warning',
          path: '',
          message: `A locale source has texts of the form, which only a translation applies. ${hint}`,
          hint,
        });
      };
  } catch {}
  warn?.();
}
