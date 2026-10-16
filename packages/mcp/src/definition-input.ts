import { z } from 'zod';

export const definitionInput = z
  .union([z.record(z.string(), z.unknown()), z.string()])
  .describe(
    'Formhaus form definition as a JSON object or a JSON string. JSON Schema: https://formhaus.dev/schema/form-definition.json. Top level: id, title, submit { label }, and fields (one step) or steps [{ id, title, fields }]. Field: { key, type, label, validation?, options?, show?, showAny? }. Rules go inside "validation": { required, minLength, maxLength, min, max, pattern, matchField }. Condition: { field, eq | neq | in | notIn | notEmpty | gt | gte | lt | lte } with exactly one operator, on a field of the same or an earlier step. Optional: lang, messages and labels catalogs, and i18n objects that map texts to translation keys.',
  );

const MAX_DEFINITION_SIZE = 256 * 1024;

export type ParsedDefinition =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; code: 'invalid-json' | 'too-large'; error: string };

const invalid = (error: string): ParsedDefinition => ({ ok: false, code: 'invalid-json', error });

function size(input: unknown): number {
  try {
    return typeof input === 'string' ? input.length : (JSON.stringify(input)?.length ?? 0);
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function parseDefinition(input: unknown): ParsedDefinition {
  if (size(input) > MAX_DEFINITION_SIZE) return { ok: false, code: 'too-large', error: 'Definition is larger than 256 KB of JSON.' };
  if (typeof input !== 'string') {
    return isRecord(input) ? { ok: true, value: input } : invalid('Definition must be a JSON object.');
  }
  try {
    const value: unknown = JSON.parse(input);
    return isRecord(value) ? { ok: true, value } : invalid('Definition must be a JSON object.');
  } catch (error) {
    return invalid(`Definition is not valid JSON: ${(error as Error).message}`);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
