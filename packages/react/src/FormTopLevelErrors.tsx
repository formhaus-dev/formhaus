import type { FormEngine } from '@formhaus/core';
import { useFormSnapshot } from './hooks/useEngineSnapshot';

export function FormTopLevelErrors({ engine }: { engine: FormEngine }) {
  useFormSnapshot(engine);
  if (engine.topLevelErrors.length === 0) return null;

  return (
    <div className="fh-form__top-errors">
      {engine.topLevelErrors.map((error) => (
        <p key={error} className="fh-form__top-error">
          {error}
        </p>
      ))}
    </div>
  );
}
