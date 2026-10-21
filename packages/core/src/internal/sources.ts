import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import { resolveSources, type SourceContext } from '../sources';

interface Browser {
  location: { search: string; href: string };
  document: { referrer: string; title: string };
  navigator: { language: string; userAgentData?: { mobile?: boolean } };
  matchMedia(query: string): { matches: boolean };
}

function device(browser: Browser): string {
  if (browser.navigator.userAgentData?.mobile) return 'mobile';
  if (!browser.matchMedia('(pointer: coarse)').matches) return 'desktop';
  return browser.matchMedia('(min-width: 600px) and (min-height: 600px)').matches ? 'tablet' : 'mobile';
}

function browserSources(): SourceContext {
  const browser = globalThis as unknown as Browser;
  const { location, document, navigator } = browser;
  return {
    get search() {
      return location.search;
    },
    get href() {
      return location.href;
    },
    get referrer() {
      return document.referrer;
    },
    get pageTitle() {
      return document.title;
    },
    get language() {
      return navigator.language;
    },
    get timezone() {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    },
    get device() {
      return device(browser);
    },
  };
}

export function applySources(engine: FormEngine, initialValues?: Record<string, unknown>): void {
  const values = resolveSources(engine.definition, browserSources(), initialValues);
  const keys = Object.keys(values);
  if (!keys.length) return;
  (engine as unknown as EngineInternals).visibility.seedStarts(values);
  for (const key of keys) engine.setValue(key, values[key]);
}
