import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { components } from './component-map';
import json from './definition.json';
import { FormActions } from './FormActions';
import { StepProgress } from './StepProgress';

const definition = json as FormDefinition;

export function App() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{definition.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <pre className="text-sm">{JSON.stringify(submitted, null, 2)}</pre>
          ) : (
            <FormRenderer
              definition={definition}
              components={components}
              ActionsComponent={FormActions}
              ProgressComponent={StepProgress}
              onSubmit={setSubmitted}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
