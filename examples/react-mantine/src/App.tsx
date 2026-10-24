import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { Container, MantineProvider, type CSSVariablesResolver } from '@mantine/core';
import { useState } from 'react';
import { FormCompletion } from './FormCompletion';
import { components } from './component-map';
import json from './definition.json';
import { layout } from './layout';
import type { Theme as Scheme } from './playground';

const initial = parseDefinition(json);
const resolver: CSSVariablesResolver = () => ({ variables: {}, light: {}, dark: { '--mantine-color-body': '#121212' } });

export function App({ definition = initial, scheme }: { definition?: FormDefinition; scheme?: Scheme }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <MantineProvider defaultColorScheme="auto" forceColorScheme={scheme} cssVariablesResolver={resolver}>
      <Container size={632} py="xl">
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
      </Container>
    </MantineProvider>
  );
}
