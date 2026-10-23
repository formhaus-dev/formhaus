import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { useState } from 'react';
import { components, layout } from './component-map';
import json from './definition.json';

const initial = parseDefinition(json);

export function App({ definition = initial }: { definition?: FormDefinition }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const steps = !!definition.steps?.length;

  return (
    <div className="govuk-width-container">
      <main className="govuk-main-wrapper" id="main-content">
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds app-form">
            {submitted ? (
              <div className="govuk-panel govuk-panel--confirmation">
                <h1 className="govuk-panel__title">Application complete</h1>
                <pre className="govuk-panel__body govuk-!-font-size-16">{JSON.stringify(submitted, null, 2)}</pre>
              </div>
            ) : (
              <>
                {!steps && <h1 className="govuk-heading-l">{definition.title}</h1>}
                <FormRenderer
                  definition={definition}
                  components={components}
                  layout={layout}
                  headingLevel={steps ? 1 : 2}
                  labels={{ errorSummary: 'There is a problem' }}
                  onSubmit={setSubmitted}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
