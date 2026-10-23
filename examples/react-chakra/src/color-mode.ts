import { useEffect, useSyncExternalStore } from 'react';
import type { Scheme } from './playground';

const query = window.matchMedia('(prefers-color-scheme: dark)');
const subscribe = (notify: () => void) => {
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};

export function useColorMode(forced?: Scheme) {
  const system = useSyncExternalStore(subscribe, () => (query.matches ? 'dark' : 'light'));
  const scheme = forced ?? system;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', scheme === 'dark');
    root.classList.toggle('light', scheme === 'light');
    root.style.colorScheme = scheme;
  }, [scheme]);
}
