import { validateDefinition } from '../definition-validation';
import { definitionErrors } from '../engine/step-routes';
import type { FormDefinition } from '../types';

export interface DefinitionCheck {
  errors: string[];
  warnings: string[];
}

export function checkDefinition(definition: FormDefinition): DefinitionCheck {
  const errors = definitionErrors(definition);
  const rejected = new Set(errors);
  return { errors, warnings: validateDefinition(definition).filter((message) => !rejected.has(message)) };
}
