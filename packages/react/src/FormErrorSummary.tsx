import { errorSummary, type FormEngine } from '@formhaus/core';
import { ROOT_PROPS } from '@formhaus/core/internal';
import { Fragment, useContext, useMemo } from 'react';
import { LabelContext } from './labels';
import type { ErrorSummaryComponentProps, FormRendererProps, LayoutComponentMap } from './types';
import { useRecallSnapshot } from './hooks/useEngineSnapshot';

interface FormErrorSummaryProps {
  engine: FormEngine;
  formId: string;
  onSelect: (key: string) => void;
  labels?: FormRendererProps['labels'];
  layout?: LayoutComponentMap;
  testId?: string;
}

function DefaultErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <div className="fh-error-summary" {...rootProps}>
      <strong className="fh-error-summary__title">{title}</strong>
      {groups.map(({ id, title: step, entries }) => (
        <Fragment key={id}>
          {groups.length > 1 && <p className="fh-error-summary__step">{step}</p>}
          <ul className="fh-error-summary__list">
            {entries.map(({ key, id: target, text }) => (
              <li key={key}>
                <a
                  className="fh-error-summary__link"
                  href={`#${target}`}
                  onClick={(event) => {
                    event.preventDefault();
                    showField(key);
                  }}
                >
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </div>
  );
}

export function FormErrorSummary({ engine, formId, onSelect, labels, layout, testId }: FormErrorSummaryProps) {
  const version = useRecallSnapshot(engine);
  const text = useContext(LabelContext);
  const { groups, count } = useMemo(() => errorSummary(engine, { idPrefix: formId, labels }), [engine, version, formId, labels]);
  if (count === 0) return null;
  const Summary = layout?.errorSummary ?? DefaultErrorSummary;
  return (
    <Summary
      rootProps={{ ...ROOT_PROPS.errorSummary, 'data-testid': testId }}
      title={text('errorSummary')}
      groups={groups}
      count={count}
      showField={onSelect}
    />
  );
}
