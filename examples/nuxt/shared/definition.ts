import { parseDefinition } from '@formhaus/core';
import json from './definition.json';

export const definition = parseDefinition(json);

export type SubmitResponse =
  | { values: Record<string, unknown> }
  | { errors: Record<string, string> };
