import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormCompletion } from './FormCompletion';
import { components } from './component-map';
import json from './definition.json';
import { FormActions } from './FormActions';
import { ErrorSummary } from './ErrorSummary';
import { ConfirmDialog, Group, GroupItem } from './Groups';
import { Section } from './Section';
import { StepProgress } from './StepProgress';

const layout = {
  actions: FormActions,
  progress: StepProgress,
  section: Section,
  errorSummary: ErrorSummary,
  group: Group,
  groupItem: GroupItem,
  confirmDialog: ConfirmDialog,
};

const initial = parseDefinition(json);

export function App({ definition = initial }: { definition?: FormDefinition }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <main className="mx-auto max-w-166 px-4 py-8">
      {submitted ? (
        <FormCompletion definition={definition} values={submitted} onRestart={() => setSubmitted(null)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{definition.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormRenderer definition={definition} components={components} layout={layout} conditionalReveal onSubmit={setSubmitted} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
