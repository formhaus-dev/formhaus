import { FormDefinitionError, FormEngine, type DefinitionIssue, type FormDefinition } from '@formhaus/core';

export type EngineResult =
  | { ok: true; engine: FormEngine }
  | { ok: false; issues: DefinitionIssue[] };

export function createEngine(definition: FormDefinition, values?: Record<string, unknown>): EngineResult {
  try {
    return { ok: true, engine: new FormEngine(definition, values, { onWarning: () => {} }) };
  } catch (error) {
    if (error instanceof FormDefinitionError) return { ok: false, issues: error.issues };
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, issues: [{ code: 'invalid-type', severity: 'error', path: '', message: `/: ${message}` }] };
  }
}
