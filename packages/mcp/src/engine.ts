import { FormDefinitionError, FormEngine, type FormDefinition } from '@formhaus/core';

export type EngineResult =
  | { ok: true; engine: FormEngine; warnings: string[] }
  | { ok: false; errors: string[] };

export function createEngine(definition: FormDefinition, values?: Record<string, unknown>): EngineResult {
  const warnings: string[] = [];
  try {
    return { ok: true, engine: new FormEngine(definition, values, { onWarning: (issue) => warnings.push(issue.message) }), warnings };
  } catch (error) {
    if (error instanceof FormDefinitionError) return { ok: false, errors: error.issues.map((issue) => issue.message) };
    return { ok: false, errors: [error instanceof Error ? error.message : String(error)] };
  }
}
