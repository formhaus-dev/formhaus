import { FormDefinitionError, parseDefinition, type FormDefinition } from '@formhaus/core';

export type Theme = 'light' | 'dark';

interface Playground {
  definition: (definition: FormDefinition) => void;
  theme?: (theme: Theme) => void;
}

export function listenToPlayground({ definition, theme }: Playground) {
  const embedded = window.parent !== window;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  theme?.(media.matches ? 'dark' : 'light');
  if (!embedded) {
    media.addEventListener('change', (event) => theme?.(event.matches ? 'dark' : 'light'));
    return;
  }
  const reply = (message: object) => window.parent.postMessage(message, location.origin);
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    if (event.data?.type === 'formhaus:theme') {
      theme?.(event.data.theme === 'dark' ? 'dark' : 'light');
      return;
    }
    if (event.data?.type !== 'formhaus:definition') return;
    try {
      definition(parseDefinition(event.data.definition));
      reply({ type: 'formhaus:rendered' });
    } catch (error) {
      const issues = error instanceof FormDefinitionError ? error.issues : [{ path: '', message: String(error) }];
      reply({ type: 'formhaus:error', issues: issues.map(({ path, message }) => ({ path, message })) });
    }
  });
  reply({ type: 'formhaus:ready' });
}
