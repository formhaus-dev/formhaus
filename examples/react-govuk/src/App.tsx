import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer, type FormRendererHandle } from '@formhaus/react';
import { SkipLink } from 'govuk-frontend';
import { useEffect, useMemo, useRef, useState } from 'react';
import { components, layout } from './component-map';
import json from './definition.json';
import { useGovuk } from './govuk';
import { CheckAnswers } from './layout/CheckAnswers';
import { FormCompletion } from './layout/FormCompletion';
import { govukMessages } from './messages';
import { BackLinkTarget, PageContext, pageOf, withContinue } from './page';

const initial = parseDefinition(json);

type Values = Record<string, unknown>;
type View = { name: 'form'; values?: Values; focus?: string } | { name: 'check' | 'done'; values: Values };

export function App({ definition = initial }: { definition?: FormDefinition }) {
  const [view, setView] = useState<View>({ name: 'form' });
  const [backLink, setBackLink] = useState<HTMLDivElement | null>(null);
  const form = useRef<FormRendererHandle>(null);
  const guided = useMemo(() => withContinue(definition), [definition]);
  const page = useMemo(() => pageOf(definition), [definition]);
  const messages = useMemo(() => govukMessages(definition), [definition]);
  const skipLink = useGovuk(SkipLink);

  useEffect(() => {
    if (view.name === 'form' && view.focus) form.current?.showField(view.focus);
    else window.scrollTo(0, 0);
  }, [view]);

  return (
    <>
      <a href="#main-content" className="govuk-skip-link" data-module="govuk-skip-link" ref={skipLink}>
        Skip to main content
      </a>
      <div className="govuk-width-container">
        <div ref={setBackLink} />
        <main className="govuk-main-wrapper" id="main-content">
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-full app-form-column">
              {view.name === 'done' && <FormCompletion onRestart={() => setView({ name: 'form' })} />}
              {view.name === 'check' && (
                <CheckAnswers
                  definition={definition}
                  values={view.values}
                  sendLabel={definition.submit.label}
                  onChange={(focus) => setView({ name: 'form', values: view.values, focus })}
                  onSend={() => setView({ name: 'done', values: view.values })}
                />
              )}
              {view.name === 'form' && (
                <BackLinkTarget value={backLink}>
                  <PageContext value={page}>
                    <FormRenderer
                      ref={form}
                      definition={guided}
                      initialValues={view.values}
                      components={components}
                      layout={layout}
                      headingLevel={1}
                      labels={{ errorSummary: 'There is a problem' }}
                      messages={messages}
                      errorSummary="top"
                      conditionalReveal
                      confirmRemove={false}
                      onSubmit={(values) => setView({ name: 'check', values })}
                    />
                  </PageContext>
                </BackLinkTarget>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
