import { useEffect, useSyncExternalStore } from 'react';
import type { Theme as Scheme } from './playground';

const query = window.matchMedia('(prefers-color-scheme: dark)');
const subscribe = (notify: () => void) => {
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};

export function useColorMode(forced?: Scheme): Scheme {
  const system = useSyncExternalStore(subscribe, () => (query.matches ? 'dark' : 'light'));
  const scheme = forced ?? system;

  useEffect(() => {
    document.documentElement.style.colorScheme = scheme;
  }, [scheme]);

  return scheme;
}
