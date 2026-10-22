import { getChangedKeys } from './engine-utils';
import type { EngineInternals } from './runtime-internals';
import { getSubmitValues } from './validation-state';

function activePath(engine: EngineInternals): string {
  return engine.visibleSteps.map((step) => step.id).join('\n');
}

export function watchCheckedInputs(engine: EngineInternals, checked: Record<string, unknown>): () => boolean {
  const path = activePath(engine);
  const keys = Object.keys(checked);
  const seen = keys.map((key) => [key, engine.state.values[key]] as const);
  return () =>
    activePath(engine) !== path ||
    seen.some(([key, value]) => !Object.is(engine.state.values[key], value)) ||
    Object.keys(getSubmitValues(engine)).some(
      (key) => !keys.includes(key) && engine.visibility.activeField(key, engine.state.values)?.type !== 'hidden',
    );
}

export function watchValues(engine: EngineInternals, values: Record<string, unknown>): () => Set<string> {
  const seen = { ...values };
  return () => getChangedKeys(seen, engine.state.values);
}
