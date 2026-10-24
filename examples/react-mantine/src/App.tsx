import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { Code, Container, MantineProvider, Stack, Title, type CSSVariablesResolver } from '@mantine/core';
import { useState } from 'react';
import { components } from './component-map';
import json from './definition.json';
import { layout } from './layout';
import type { Theme as Scheme } from './playground';

const initial = parseDefinition(json);
const resolver: CSSVariablesResolver = () => ({ variables: {}, light: {}, dark: { '--mantine-color-body': '#121212' } });
const show = (_: string, value: unknown) => (value instanceof File ? `File: ${value.name}` : value);

export function App({ definition = initial, scheme }: { definition?: FormDefinition; scheme?: Scheme }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <MantineProvider defaultColorScheme="auto" forceColorScheme={scheme} cssVariablesResolver={resolver}>
      <Container size="sm" py="xl">
        {submitted ? (
          <Stack gap="sm">
            <Title order={2}>Submitted</Title>
            <Code block>{JSON.stringify(submitted, show, 2)}</Code>
          </Stack>
        ) : (
          <FormRenderer definition={definition} components={components} layout={layout} stepErrorMarks onSubmit={setSubmitted} />
        )}
      </Container>
    </MantineProvider>
  );
}
