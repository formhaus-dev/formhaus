import { z } from 'zod';

export const definitionInput = z
  .union([z.record(z.string(), z.unknown()), z.string()])
  .describe('Formhaus form definition as a JSON object or a JSON string.');

export type DefinitionInput = z.infer<typeof definitionInput>;

export type ParsedDefinition =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string };

export function parseDefinition(input: unknown): ParsedDefinition {
  if (typeof input !== 'string') {
    return isRecord(input) ? { ok: true, value: input } : { ok: false, error: 'Definition must be a JSON object.' };
  }
  try {
    const value: unknown = JSON.parse(input);
    return isRecord(value) ? { ok: true, value } : { ok: false, error: 'Definition must be a JSON object.' };
  } catch (error) {
    return { ok: false, error: `Definition is not valid JSON: ${(error as Error).message}` };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
