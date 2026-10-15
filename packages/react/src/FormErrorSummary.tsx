import type { FormEngine } from '@formhaus/core';
import { fieldDomId, labelFor } from '@formhaus/core/internal';
import type { FormRendererProps } from './types';
import { useFormSnapshot } from './hooks/useEngineSnapshot';

interface FormErrorSummaryProps {
  engine: FormEngine;
  formId: string;
  onSelect: (key: string) => void;
  labels?: FormRendererProps['labels'];
}

export function FormErrorSummary({ engine, formId, onSelect, labels }: FormErrorSummaryProps) {
  useFormSnapshot(engine);
  const fields = engine.isMultiStep ? engine.visibleSteps.flatMap((step) => step.fields) : engine.visibleFields;
  const invalid = fields.filter((field) => field.type !== 'hidden' && engine.errors[field.key] !== undefined);
  if (invalid.length === 0) return null;

  return (
    <div className="fh-error-summary" role="alert">
      <strong className="fh-error-summary__title">{labelFor('errorSummary', {}, labels, engine.definition.labels)}</strong>
      <ul className="fh-error-summary__list">
        {invalid.map((field) => (
          <li key={field.key}>
            <a
              className="fh-error-summary__link"
              href={`#${fieldDomId(formId, field.key, engine.definition)}`}
              onClick={(event) => {
                event.preventDefault();
                onSelect(field.key);
              }}
            >
              {field.label}: {engine.errors[field.key]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
