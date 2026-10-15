import type { FormDefinition, FormNode } from '@formhaus/core';
import { flatFields } from './nodes';

export function parseAndValidate(json: string): FormDefinition {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json);
  } catch (_e) {
    throw new Error('Invalid JSON. Check syntax and try again.');
  }
  if (!parsed.title) {
    throw new Error("Definition must have a 'title'.");
  }
  if (!parsed.fields && !parsed.steps) {
    throw new Error("Definition must have 'fields' (single-step) or 'steps' (multi-step).");
  }
  if (!parsed.submit) {
    throw new Error("Definition must have a 'submit' action.");
  }
  return parsed as unknown as FormDefinition;
}

export function countFields(definition: FormDefinition): number {
  if (definition.fields) return flatFields(definition.fields).length;
  return (definition.steps || []).reduce((sum, s) => sum + flatFields(s.fields).length, 0);
}

export function getSteps(definition: FormDefinition): { title: string; description?: string; fields: FormNode[] }[] {
  if (definition.steps && definition.steps.length > 0) {
    return definition.steps;
  }
  return [{ title: definition.title, description: definition.description, fields: definition.fields || [] }];
}
