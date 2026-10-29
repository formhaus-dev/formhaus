import type { EngineInternals } from './runtime-internals';

export function watchOperation(engine: EngineInternals, changed: () => boolean) {
  const controller = new AbortController();
  const stale = (): boolean => {
    if (!controller.signal.aborted && changed()) {
      stop();
      controller.abort();
    }
    return controller.signal.aborted;
  };
  const stop = engine.subscribe(stale);
  return { signal: controller.signal, stale, stop };
}
