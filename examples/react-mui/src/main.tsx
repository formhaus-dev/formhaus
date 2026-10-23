import type { FormDefinition } from '@formhaus/core';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { listenToPlayground, type Theme } from './playground';

const root = ReactDOM.createRoot(document.getElementById('root')!);
const state: { definition?: FormDefinition; mode: Theme; version: number } = { mode: 'light', version: 0 };

function render() {
  root.render(
    <React.StrictMode>
      <App key={state.version} definition={state.definition} mode={state.mode} />
    </React.StrictMode>,
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
