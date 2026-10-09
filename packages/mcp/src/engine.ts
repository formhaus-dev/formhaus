import { FormEngine, type FormDefinition } from '@formhaus/core';

export type EngineResult =
  | { ok: true; engine: FormEngine; warnings: string[] }
  | { ok: false; errors: string[] };

const PREFIX = '[FormEngine] ';

export function createEngine(definition: FormDefinition, values?: Record<string, unknown>): EngineResult {
  const warnings: string[] = [];
  const warn = console.warn;
  console.warn = (message: unknown) => { warnings.push(String(message).replace(PREFIX, '')); };
  try {
    return { ok: true, engine: new FormEngine(definition, values), warnings };
  } catch (error) {
    return { ok: false, errors: (error instanceof Error ? error.message : String(error)).split('\n') };
  } finally {
    console.warn = warn;
  }
}
