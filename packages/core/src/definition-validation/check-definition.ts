import type { FormDefinition } from '../types';
import { conditionIssues } from './conditions';
import { createContext, type CheckContext } from './context';
import { fieldIssues } from './fields';
import { graphIssues } from './graph';
import { FormDefinitionError, withTexts, type DefinitionIssue } from './issues';
import { metaIssues, shapeIssues } from './shape';
import { sourceIssues } from './sources';
import { structureIssues } from './structure';
import { ISSUE_TEXTS } from './texts';
import { definitionWarnings } from './warnings';

export interface CheckDefinitionOptions {
  validators?: Record<string, unknown>;
}

interface Checks {
  validators?: Record<string, unknown>;
  warnings?: (context: CheckContext) => DefinitionIssue[];
}

function issues(input: unknown, { validators, warnings }: Checks = {}): DefinitionIssue[] {
  const shape = shapeIssues(input);
  if (shape.length) return shape;
  const context = createContext(input as FormDefinition, validators);
  return [
    ...metaIssues(input as Record<string, unknown>),
    ...structureIssues(context),
    ...conditionIssues(context),
    ...fieldIssues(context),
    ...sourceIssues(context),
    ...graphIssues(context),
    ...(warnings ? warnings(context) : []),
  ];
}

export function definitionErrors(input: unknown): DefinitionIssue[] {
  return issues(input);
}

export function checkDefinition(input: unknown, options: CheckDefinitionOptions = {}): DefinitionIssue[] {
  return withTexts(ISSUE_TEXTS, () => issues(input, { validators: options.validators, warnings: definitionWarnings }));
}

export const parsed = new WeakMap<object, boolean>();

export function validDefinition(input: unknown): FormDefinition {
  const errors = withTexts(ISSUE_TEXTS, () => issues(input));
  if (errors.length) throw new FormDefinitionError(errors);
  return input as FormDefinition;
}

export function parseDefinition(input: unknown): FormDefinition {
  const definition = validDefinition(input);
  parsed.set(definition, false);
  return definition;
}
