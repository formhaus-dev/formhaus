import type { FormDefinition } from '../types';
import { conditionIssues } from './conditions';
import { createContext, type CheckContext } from './context';
import { fieldIssues } from './fields';
import { graphIssues } from './graph';
import { FormDefinitionError, suggest, type DefinitionIssue } from './issues';
import { metaIssues, shapeIssues } from './shape';
import { structureIssues } from './structure';
import { definitionWarnings } from './warnings';

export interface CheckDefinitionOptions {
  validators?: Record<string, unknown>;
}

interface Checks {
  validators?: Record<string, unknown>;
  suggest?: CheckContext['suggest'];
  warnings?: (context: CheckContext) => DefinitionIssue[];
}

function issues(input: unknown, { validators, suggest, warnings }: Checks = {}): DefinitionIssue[] {
  const shape = shapeIssues(input);
  if (shape.length) return shape;
  const context = createContext(input as FormDefinition, validators, suggest);
  return [
    ...metaIssues(input as Record<string, unknown>),
    ...structureIssues(context),
    ...conditionIssues(context),
    ...fieldIssues(context),
    ...graphIssues(context),
    ...(warnings ? warnings(context) : []),
  ];
}

export function definitionErrors(input: unknown): DefinitionIssue[] {
  return issues(input);
}

export function checkDefinition(input: unknown, options: CheckDefinitionOptions = {}): DefinitionIssue[] {
  return issues(input, { validators: options.validators, suggest, warnings: definitionWarnings });
}

export function parseDefinition(input: unknown, options?: CheckDefinitionOptions): FormDefinition {
  const errors = issues(input, { suggest });
  if (errors.length) throw new FormDefinitionError(errors);
  return input as FormDefinition;
}
