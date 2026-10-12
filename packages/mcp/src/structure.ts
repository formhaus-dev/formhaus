import type { FormDefinition, FormField, FormStep } from '@formhaus/core';
import { issue, type Issue } from './issues';
import { FIELD_TYPES } from './vocabulary';

const KNOWN_TYPES = new Set<string>(FIELD_TYPES);

function fieldIssues(field: FormField, path: string): Issue[] {
  const issues: Issue[] = [];
  if (!KNOWN_TYPES.has(field.type)) {
    issues.push(issue('custom-field-type', 'warning', `${path}/type`, `"${field.type}" is a custom type`, 'Register a component for it in the renderer, or use a built-in type'));
  }
  if (field.autoAdvance && field.type !== 'radio') {
    issues.push(issue('auto-advance-ignored', 'warning', `${path}/autoAdvance`, 'only radio fields advance automatically', 'Remove autoAdvance or use a radio field'));
  }
  return issues;
}

export function advancingRadios(step: FormStep): FormField[] {
  return step.fields.filter((field) => field.type === 'radio' && field.autoAdvance);
}

export function structureIssues(definition: FormDefinition): Issue[] {
  const fields = definition.fields ?? [];
  const steps = definition.steps ?? [];
  const issues = fields.flatMap((field, index) => fieldIssues(field, `/fields/${index}`));
  if (!fields.length && !steps.length) issues.push(issue('empty-form', 'warning', '', 'the definition has no fields and no steps', 'Add "fields" or "steps"'));
  steps.forEach((step, index) => {
    issues.push(...step.fields.flatMap((field, position) => fieldIssues(field, `/steps/${index}/fields/${position}`)));
    if (step.next === false && index < steps.length - 1 && !advancingRadios(step).length) {
      issues.push(issue('next-hidden', 'warning', `/steps/${index}/next`, 'next is false and no autoAdvance radio moves the form forward', 'Add an autoAdvance radio or remove "next": false'));
    }
  });
  return issues;
}
