import type { FormEngine } from '@formhaus/core';
import { errorEntries, labelFor } from '@formhaus/core/internal';
import { useMemo } from 'react';
import type { FormRendererProps } from './types';
import { useFormSnapshot } from './hooks/useEngineSnapshot';

interface FormErrorSummaryProps {
  engine: FormEngine;
  formId: string;
  onSelect: (key: string) => void;
  labels?: FormRendererProps['labels'];
}

export function FormErrorSummary({ engine, formId, onSelect, labels }: FormErrorSummaryProps) {
  const version = useFormSnapshot(engine);
  const entries = useMemo(() => errorEntries(engine, formId, labels, engine.definition.labels), [engine, version, formId, labels]);
  if (entries.length === 0) return null;

  return (
    <div className="fh-error-summary" role="alert">
      <strong className="fh-error-summary__title">{labelFor('errorSummary', {}, labels, engine.definition.labels)}</strong>
      <ul className="fh-error-summary__list">
        {entries.map(({ key, id, label, message }) => (
          <li key={key}>
            <a
              className="fh-error-summary__link"
              href={`#${id}`}
              onClick={(event) => {
                event.preventDefault();
                onSelect(key);
              }}
            >
              {label}: {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
