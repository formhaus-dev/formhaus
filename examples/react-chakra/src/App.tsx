import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { ChakraProvider, Code, Container, Heading, Stack, defaultSystem } from '@chakra-ui/react';
import { useState } from 'react';
import { useColorMode } from './color-mode';
import { components } from './component-map';
import json from './definition.json';
import { layout } from './layout';
import type { Theme as Scheme } from './playground';

const initial = parseDefinition(json);
const show = (_: string, value: unknown) => (value instanceof File ? `File: ${value.name}` : value);

export function App({ definition = initial, scheme }: { definition?: FormDefinition; scheme?: Scheme }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  useColorMode(scheme);

  return (
    <ChakraProvider value={defaultSystem}>
      <Container maxW="2xl" py="10">
        {submitted ? (
          <Stack gap="3">
            <Heading as="h2" size="xl">
              Submitted
            </Heading>
            <Code as="pre" display="block" p="4" whiteSpace="pre-wrap">
              {JSON.stringify(submitted, show, 2)}
            </Code>
          </Stack>
        ) : (
          <FormRenderer definition={definition} components={components} layout={layout} stepErrorMarks onSubmit={setSubmitted} />
        )}
      </Container>
    </ChakraProvider>
  );
}
