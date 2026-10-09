import type { FormDefinition } from '@formhaus/core';
import basic from '../../../examples/definitions/basic-form.json';
import branching from '../../../examples/definitions/branching-form.json';
import conditional from '../../../examples/definitions/conditional-fields.json';
import multiStep from '../../../examples/definitions/multi-step.json';
import validation from '../../../examples/definitions/validation.json';

export interface ExampleSummary {
  id: string;
  title: string;
  shows: string;
}

const EXAMPLES: { definition: FormDefinition; shows: string }[] = [
  { definition: basic as FormDefinition, shows: 'Single-page form with common field types.' },
  { definition: validation as FormDefinition, shows: 'Validation rules and custom messages.' },
  { definition: conditional as FormDefinition, shows: 'Fields shown by show/showAny conditions.' },
  { definition: multiStep as FormDefinition, shows: 'Linear multi-step form.' },
  { definition: branching as FormDefinition, shows: 'Branching steps with routes and autoAdvance.' },
];

export function exampleDefinitionsTool(input: { id?: string }): { examples: ExampleSummary[] } | { definition: FormDefinition } | { error: string } {
  if (input.id === undefined) {
    return { examples: EXAMPLES.map(({ definition, shows }) => ({ id: definition.id, title: definition.title, shows })) };
  }
  const match = EXAMPLES.find(({ definition }) => definition.id === input.id);
  return match ? { definition: match.definition } : { error: `Unknown example "${input.id}". Call without id to list examples.` };
}
