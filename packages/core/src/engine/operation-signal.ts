import type { EngineInternals } from './runtime-internals';

export function abortWhenStale(engine: EngineInternals, stale: () => boolean): { signal: AbortSignal; stop: () => void } {
  const controller = new AbortController();
  const stop = engine.subscribe(() => {
    if (!stale()) return;
    stop();
    controller.abort();
  });
  return { signal: controller.signal, stop };
}
