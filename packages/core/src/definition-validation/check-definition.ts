import type { FormDefinition } from '../types';
import { conditionIssues } from './conditions';
import { createContext, type CheckContext } from './context';
import { fieldIssues } from './fields';
import { graphIssues } from './graph';
import { FormDefinitionError, type DefinitionIssue } from './issues';
import { metaIssues, shapeIssues } from './shape';
import { structureIssues } from './structure';
import { definitionWarnings } from './warnings';

export interface CheckDefinitionOptions {
  validators?: Record<string, unknown>;
}

function issues(input: unknown, validators: Record<string, unknown> | undefined, warnings?: (context: CheckContext) => DefinitionIssue[]): DefinitionIssue[] {
  const shape = shapeIssues(input);
  if (shape.length) return shape;
  const context = createContext(input as FormDefinition, validators);
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
  return issues(input, undefined);
}

export function checkDefinition(input: unknown, options: CheckDefinitionOptions = {}): DefinitionIssue[] {
  return issues(input, options.validators, definitionWarnings);
}

export function parseDefinition(input: unknown, options?: CheckDefinitionOptions): FormDefinition {
  const errors = definitionErrors(input);
  if (errors.length) throw new FormDefinitionError(errors);
  return input as FormDefinition;
}
