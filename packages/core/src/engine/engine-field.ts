import type { ActiveField } from './recall';
import type { FormEngine } from './runtime';
import type { EngineInternals } from './runtime-internals';

export const engineField = (engine: FormEngine<object>): ActiveField => {
  const internals = engine as unknown as EngineInternals;
  return (key) => internals.visibility.activeField(key, internals.state.values);
};
