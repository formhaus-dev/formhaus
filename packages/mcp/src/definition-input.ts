import { z } from 'zod';

export const definitionInput = z
  .union([z.record(z.string(), z.unknown()), z.string()])
  .describe('Formhaus form definition as a JSON object or a JSON string. JSON Schema: https://formhaus.dev/schema/form-definition.json. Top level: id, title, submit { label }, and fields (one step) or steps [{ id, title, fields }]. Field: { key, type, label, validation?, options?, show?, showAny? }. Rules go inside "validation": { required, minLength, maxLength, min, max, pattern, matchField }. Condition: { field, eq | neq | in | notIn | notEmpty | gt | gte | lt | lte } with exactly one operator, on a field of the same or an earlier step. Optional: lang, messages and labels catalogs, and i18n objects that map texts to translation keys.');

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
