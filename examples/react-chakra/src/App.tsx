import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { ChakraProvider, Container, createSystem, defaultConfig } from '@chakra-ui/react';
import { useState } from 'react';
import { useColorMode } from './color-mode';
import { FormCompletion } from './FormCompletion';
import { components } from './component-map';
import json from './definition.json';
import { layout } from './layout';
import type { Theme as Scheme } from './playground';

const initial = parseDefinition(json);

const system = createSystem(defaultConfig, {
  theme: {
    tokens: { fonts: { body: { value: 'system-ui, sans-serif' }, heading: { value: 'system-ui, sans-serif' } } },
    semanticTokens: { colors: { gray: { focusRing: { value: { _light: '{colors.gray.900}', _dark: '{colors.white}' } } } } },
  },
});

export function App({ definition = initial, scheme }: { definition?: FormDefinition; scheme?: Scheme }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  useColorMode(scheme);

  return (
    <ChakraProvider value={system}>
      <Container maxW="2xl" py="10">
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
    </ChakraProvider>
  );
}
