import type { FormEngine } from '@formhaus/core';
import { errorGroups, labelFor } from '@formhaus/core/internal';
import { Fragment, useMemo } from 'react';
import type { FormRendererProps } from './types';
import { useRecallSnapshot } from './hooks/useEngineSnapshot';

interface FormErrorSummaryProps {
  engine: FormEngine;
  formId: string;
  onSelect: (key: string) => void;
  labels?: FormRendererProps['labels'];
}

export function FormErrorSummary({ engine, formId, onSelect, labels }: FormErrorSummaryProps) {
  const version = useRecallSnapshot(engine);
  const groups = useMemo(() => errorGroups(engine, formId, labels, engine.definition.labels), [engine, version, formId, labels]);
  if (groups.length === 0) return null;

  return (
    <div className="fh-error-summary" role="alert">
      <strong className="fh-error-summary__title">{labelFor('errorSummary', {}, labels, engine.definition.labels)}</strong>
      {groups.map(({ id, title, entries }) => (
        <Fragment key={id}>
          {groups.length > 1 && <p className="fh-error-summary__step">{title}</p>}
          <ul className="fh-error-summary__list">
            {entries.map(({ key, id: target, text }) => (
              <li key={key}>
                <a
                  className="fh-error-summary__link"
                  href={`#${target}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onSelect(key);
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
