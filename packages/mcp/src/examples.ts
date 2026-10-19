import type { FormDefinition } from '@formhaus/core';
import basic from '../../../examples/definitions/basic-form.json';
import branching from '../../../examples/definitions/branching-form.json';
import conditional from '../../../examples/definitions/conditional-fields.json';
import localized from '../../../examples/definitions/localized-form.json';
import multiStep from '../../../examples/definitions/multi-step.json';
import validation from '../../../examples/definitions/validation.json';
import registration from '../../../examples/definitions/event-registration.json';
import survey from '../../../examples/definitions/survey.json';

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
  { definition: localized as FormDefinition, shows: 'Russian form with lang, messages and labels catalogs.' },
  {
    definition: registration as FormDefinition,
    shows: 'Format 1.1 form with a conditional section and a repeatable group of participants.',
  },
  {
    definition: survey as FormDefinition,
    shows: 'Format 1.3 survey: welcome step, NPS scale with autoAdvance and a numeric condition, rating, picture choice and a matrix.',
  },
];

export function exampleDefinitionsTool(input: {
  id?: string;
}): { examples: ExampleSummary[] } | { definition: FormDefinition } | { error: string } {
  if (input.id === undefined) {
    return { examples: EXAMPLES.map(({ definition, shows }) => ({ id: definition.id, title: definition.title, shows })) };
  }
  const match = EXAMPLES.find(({ definition }) => definition.id === input.id);
  return match ? { definition: match.definition } : { error: `Unknown example "${input.id}". Call without id to list examples.` };
}
