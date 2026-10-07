import type { EngineInternals } from './runtime-internals';

function activePath(engine: EngineInternals): string {
  return engine.visibleSteps.map((step) => step.id).join('\n');
}

export function watchCheckedInputs(engine: EngineInternals, checked: Record<string, unknown>): () => boolean {
  const path = activePath(engine);
  return () => activePath(engine) !== path || Object.keys(checked).some(
    (key) => checked[key] !== undefined && !Object.is(engine.values[key], checked[key]),
  );
}
