import { useSyncExternalStore } from 'react';

const root = () => document.documentElement;

const isDark = () => root().classList.contains('dark') || root().dataset.theme === 'dark';

function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(root(), { attributes: true, attributeFilter: ['class', 'data-theme'] });
  return () => {
    observer.disconnect();
  };
}

export function useDarkPage(): boolean {
  return useSyncExternalStore(subscribe, isDark, () => false);
}
