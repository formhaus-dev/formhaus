import type { FormDefinition } from '@formhaus/core';
import json from './definition.json';

export const definition = json as FormDefinition;

export type SubmitResponse =
  | { values: Record<string, unknown> }
  | { errors: Record<string, string> };
