import { FormDefinitionError, parseDefinition, type FormDefinition } from '@formhaus/core';

export function listenToPlayground(render: (definition: FormDefinition) => void) {
  if (window.parent === window) return;
  const reply = (message: object) => window.parent.postMessage(message, location.origin);
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    if (event.data?.type !== 'formhaus:definition') return;
    try {
      render(parseDefinition(event.data.definition));
      reply({ type: 'formhaus:rendered' });
    } catch (error) {
      const issues = error instanceof FormDefinitionError ? error.issues : [{ path: '', message: String(error) }];
      reply({ type: 'formhaus:error', issues: issues.map(({ path, message }) => ({ path, message })) });
    }
  });
  reply({ type: 'formhaus:ready' });
}
