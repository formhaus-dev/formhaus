import type { FormDefinition } from '@formhaus/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { listenToPlayground, type Theme as Scheme } from './playground';

const root = createRoot(document.getElementById('root')!);
let version = 0;
let definition: FormDefinition | undefined;
let scheme: Scheme | undefined;

function render() {
  root.render(
    <StrictMode>
      <App key={version} definition={definition} scheme={scheme} />
    </StrictMode>,
  );
}

render();
listenToPlayground({
  definition: (next) => {
    definition = next;
    version++;
    render();
  },
  theme: (next) => {
    scheme = next;
    render();
  },
});
