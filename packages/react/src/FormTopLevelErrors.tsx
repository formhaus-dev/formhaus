import type { FormEngine } from '@formhaus/core';
import { useFormSnapshot } from './hooks/useEngineSnapshot';

export function FormTopLevelErrors({ engine, actionError }: { engine: FormEngine; actionError?: string | null }) {
  useFormSnapshot(engine);
  const errors = actionError ? [...engine.topLevelErrors, actionError] : engine.topLevelErrors;
  if (errors.length === 0) return null;

  return (
    <div className="fh-form__top-errors">
      {errors.map((error, index) => (
        <p key={index} className="fh-form__top-error">
          {error}
        </p>
      ))}
    </div>
  );
}
