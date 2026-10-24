import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { useState } from 'react';
import json from './definition.json';

const initial = parseDefinition(json);

export function App({ definition = initial }: { definition?: FormDefinition }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <main className="page">
      {submitted ? <pre>{JSON.stringify(submitted, null, 2)}</pre> : <FormRenderer definition={definition} onSubmit={setSubmitted} />}
    </main>
  );
}
