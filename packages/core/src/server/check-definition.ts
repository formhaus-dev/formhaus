import { validateDefinition } from '../definition-validation';
import { shapeErrors } from '../definition-validation/shape-errors';
import { definitionErrors } from '../engine/step-routes';
import type { FormDefinition } from '../types';

export interface DefinitionCheck {
  errors: string[];
  warnings: string[];
}

export function checkDefinition(input: unknown): DefinitionCheck {
  const shape = shapeErrors(input);
  if (shape.length) return { errors: shape, warnings: [] };
  const definition = input as FormDefinition;
  const errors = definitionErrors(definition);
  const rejected = new Set(errors);
  return { errors, warnings: validateDefinition(definition).filter((message) => !rejected.has(message)) };
}
