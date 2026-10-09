import { FormEngine, type FormDefinition } from '@formhaus/core';

export type EngineResult =
  | { ok: true; engine: FormEngine }
  | { ok: false; errors: string[] };

export function createEngine(definition: FormDefinition, values?: Record<string, unknown>): EngineResult {
  try {
    return { ok: true, engine: new FormEngine(definition, values) };
  } catch (error) {
    return { ok: false, errors: (error instanceof Error ? error.message : String(error)).split('\n') };
  }
}
