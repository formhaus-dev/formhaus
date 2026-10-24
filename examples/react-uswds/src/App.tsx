import { type FormDefinition, type FormNode, isGroup, isSection } from '@formhaus/core';
import { HeadlessFormRenderer } from '@formhaus/react';
import { useState } from 'react';
import { components } from './component-map';
import { layout } from './layout';
import { FormCompletion } from './layout/FormCompletion';

const hasRequired = (nodes: FormNode[] = []): boolean =>
  nodes.some((node) =>
    isGroup(node) || isSection(node) ? hasRequired(node.fields) : node.type !== 'hidden' && !!node.validation?.required,
  );

export function App({ definition }: { definition: FormDefinition }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const required = hasRequired(definition.fields) || !!definition.steps?.some((step) => hasRequired(step.fields));

  return (
    <main className="grid-container app">
      {definition.title && <h1 className="app__title">{definition.title}</h1>}
      {submitted ? (
        <FormCompletion definition={definition} values={submitted} onRestart={() => setSubmitted(null)} />
      ) : (
        <>
          {required && (
            <p className="usa-hint app__required">
              A red asterisk (
              <abbr title="required" className="usa-hint usa-hint--required">
                *
              </abbr>
              ) indicates a required field.
            </p>
          )}
          <HeadlessFormRenderer
            definition={definition}
            components={components}
            layout={layout}
            errorSummary="top"
            onSubmit={setSubmitted}
          />
        </>
      )}
    </main>
  );
}
