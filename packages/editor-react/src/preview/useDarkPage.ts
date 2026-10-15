import { useSyncExternalStore } from 'react';

const root = () => document.documentElement;

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)');

function isDark() {
  const page = root();
  if (page.classList.contains('dark') || page.dataset.theme === 'dark') return true;
  if (page.classList.contains('light') || page.dataset.theme === 'light') return false;
  const scheme = getComputedStyle(page).colorScheme;
  if (!scheme.includes('dark')) return false;
  return !scheme.includes('light') || systemDark().matches;
}

function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(root(), { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
  const media = systemDark();
  media.addEventListener('change', listener);
  return () => {
    observer.disconnect();
    media.removeEventListener('change', listener);
  };
}

export function useDarkPage(): boolean {
  return useSyncExternalStore(subscribe, isDark, () => false);
}
