import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { Code, Container, MantineProvider, Stack, Title } from '@mantine/core';
import { useState } from 'react';
import { components } from './component-map';
import json from './definition.json';
import { layout } from './layout';
import type { Scheme } from './playground';

const initial = parseDefinition(json);
const show = (_: string, value: unknown) => (value instanceof File ? `File: ${value.name}` : value);

export function App({ definition = initial, scheme }: { definition?: FormDefinition; scheme?: Scheme }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <MantineProvider defaultColorScheme="auto" forceColorScheme={scheme}>
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
