import { useEffect, useState } from 'react';

export type FixTools = typeof import('@formhaus/core/fix');

let tools: FixTools | null = null;
let loading: Promise<FixTools> | null = null;

function load(): Promise<FixTools> {
  loading ??= import('@formhaus/core/fix').then((module) => {
    tools = module;
    return module;
  });
  return loading;
}

export function useFixTools(): FixTools | null {
  const [loaded, setLoaded] = useState(tools);
  useEffect(() => {
    if (loaded) return;
    let alive = true;
    void load().then((module) => {
      if (alive) setLoaded(module);
    });
    return () => {
      alive = false;
    };
  }, [loaded]);
  return loaded;
}
