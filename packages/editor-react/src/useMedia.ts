import { useCallback, useSyncExternalStore } from 'react';

export const phone = '(width < 640px)';
export const finePointer = '(pointer: fine)';

export function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', listener);
      return () => {
        list.removeEventListener('change', listener);
      };
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
