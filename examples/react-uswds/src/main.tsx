import type { FormDefinition } from '@formhaus/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import json from './definition.json';
import { listenToPlayground } from './playground';
import './styles.scss';

const root = createRoot(document.getElementById('root')!);
let version = 0;

function render(definition: FormDefinition) {
  version += 1;
  root.render(
    <StrictMode>
      <App key={version} definition={definition} />
    </StrictMode>,
  );
}

render(json as FormDefinition);
listenToPlayground(render);
