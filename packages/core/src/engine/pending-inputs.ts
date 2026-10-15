import type { EngineInternals } from './runtime-internals';

function activePath(engine: EngineInternals): string {
  return engine.visibleSteps.map((step) => step.id).join('\n');
}

export function watchCheckedInputs(engine: EngineInternals, checked: Record<string, unknown>): () => boolean {
  const path = activePath(engine);
  const seen = Object.keys(checked).filter((key) => checked[key] !== undefined).map((key) => [key, engine.values[key]] as const);
  return () => activePath(engine) !== path || seen.some(([key, value]) => !Object.is(engine.values[key], value));
}

export function watchValues(engine: EngineInternals, values: Record<string, unknown>): () => boolean {
  const path = activePath(engine);
  const seen = { ...values };
  return () => activePath(engine) !== path
    || Object.keys({ ...seen, ...engine.values }).some((key) => !Object.is(engine.values[key], seen[key]));
}
