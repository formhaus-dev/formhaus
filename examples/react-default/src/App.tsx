import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { useState } from 'react';
import { FormCompletion } from './FormCompletion';
import json from './definition.json';

const initial = parseDefinition(json);

export function App({ definition = initial }: { definition?: FormDefinition }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <main className="page">
      <h1 className="fh-cloud page__title">{definition.title}</h1>
      {submitted ? (
        <FormCompletion definition={definition} values={submitted} onRestart={() => setSubmitted(null)} />
      ) : (
        <FormRenderer definition={definition} onSubmit={setSubmitted} />
      )}
    </main>
  );
}
