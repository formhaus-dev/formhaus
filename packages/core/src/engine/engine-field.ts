import type { ActiveField } from './recall';
import type { FormEngine } from './runtime';
import type { EngineInternals } from './runtime-internals';

export const engineField =
  (engine: FormEngine<object>): ActiveField =>
  (key) =>
    (engine as unknown as EngineInternals).visibility.activeField(key, engine.values as Record<string, unknown>);
