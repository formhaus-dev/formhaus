import type { FormDefinition } from '../types';
import { conditionIssues } from './conditions';
import { createContext } from './context';
import { fieldIssues } from './fields';
import { graphIssues } from './graph';
import { FormDefinitionError, isError, type DefinitionIssue } from './issues';
import { metaIssues, shapeIssues } from './shape';
import { structureIssues } from './structure';

export interface CheckDefinitionOptions {
  validators?: Record<string, unknown>;
}

function ordered(issues: DefinitionIssue[]): DefinitionIssue[] {
  return [...issues.filter(isError), ...issues.filter((issue) => !isError(issue))];
}

export function checkDefinition(input: unknown, options: CheckDefinitionOptions = {}): DefinitionIssue[] {
  const shape = shapeIssues(input);
  if (shape.length) return shape;
  const context = createContext(input as FormDefinition, options.validators);
  return ordered([
    ...metaIssues(input as Record<string, unknown>),
    ...structureIssues(context),
    ...conditionIssues(context),
    ...fieldIssues(context),
    ...graphIssues(context),
  ]);
}

export function parseDefinition(input: unknown, options?: CheckDefinitionOptions): FormDefinition {
  const errors = checkDefinition(input, options).filter(isError);
  if (errors.length) throw new FormDefinitionError(errors);
  return input as FormDefinition;
}
