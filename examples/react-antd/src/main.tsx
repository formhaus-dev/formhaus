import type { FormDefinition } from '@formhaus/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { listenToPlayground, type Theme } from './playground';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
const state: { definition?: FormDefinition; mode: Theme; version: number } = { mode: 'light', version: 0 };

function render() {
  document.documentElement.dataset.theme = state.mode;
  root.render(
    <StrictMode>
      <App key={state.version} definition={state.definition} mode={state.mode} />
    </StrictMode>,
  );
}

listenToPlayground({
  definition: (definition) => {
    state.definition = definition;
    state.version += 1;
    render();
  },
  theme: (mode) => {
    state.mode = mode;
    render();
  },
});
render();
