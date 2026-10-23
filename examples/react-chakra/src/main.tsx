import type { FormDefinition } from '@formhaus/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { listenToPlayground, type Scheme } from './playground';

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
listenToPlayground(
  (next) => {
    definition = next;
    version++;
    render();
  },
  (next) => {
    scheme = next;
    render();
  },
);
