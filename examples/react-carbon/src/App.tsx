import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { Theme } from '@carbon/react';
import { useEffect, useState } from 'react';
import { useColorMode } from './color-mode';
import { FormCompletion } from './FormCompletion';
import { components } from './component-map';
import json from './definition.json';
import { layout } from './layout';
import type { Theme as Scheme } from './playground';

const initial = parseDefinition(json);

export function App({ definition = initial, scheme }: { definition?: FormDefinition; scheme?: Scheme }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const mode = useColorMode(scheme);
  const theme = mode === 'dark' ? 'g100' : 'g10';

  useEffect(() => {
    document.body.className = `cds--${theme}`;
  }, [theme]);

  return (
    <Theme theme={theme}>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1rem' }}>
        {submitted ? (
          <FormCompletion definition={definition} values={submitted} onRestart={() => setSubmitted(null)} />
        ) : (
          <FormRenderer
            definition={definition}
            components={components}
            layout={layout}
            stepErrorMarks
            conditionalReveal
            onSubmit={setSubmitted}
          />
        )}
      </main>
    </Theme>
  );
}
