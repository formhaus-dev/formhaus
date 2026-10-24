import type { FormDefinition } from '@formhaus/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { listenToPlayground } from './playground';
import './styles.scss';

document.body.classList.add('govuk-frontend-supported');
const root = createRoot(document.getElementById('root')!);
let version = 0;

function render(definition?: FormDefinition) {
  root.render(
    <StrictMode>
      <App key={version++} definition={definition} />
    </StrictMode>,
  );
}

render();
listenToPlayground({ definition: render });
