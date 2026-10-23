import type { FormEngine } from '@formhaus/core';
import { ROOT_PROPS } from '@formhaus/core/internal';
import { useFormSnapshot } from './hooks/useEngineSnapshot';
import type { FormErrorsComponentProps, LayoutComponentMap } from './types';

function DefaultFormErrors({ rootProps, errors }: FormErrorsComponentProps) {
  return (
    <div className="fh-form__top-errors" {...rootProps}>
      {errors.map((error, index) => (
        <p key={index} className="fh-form__top-error">
          {error}
        </p>
      ))}
    </div>
  );
}

export const shownFormErrors = (engine: FormEngine, actionError?: string | null): readonly string[] =>
  actionError ? [...engine.topLevelErrors, actionError] : engine.topLevelErrors;

export function FormTopLevelErrors({
  engine,
  actionError,
  layout,
}: {
  engine: FormEngine;
  actionError?: string | null;
  layout?: LayoutComponentMap;
}) {
  useFormSnapshot(engine);
  const errors = shownFormErrors(engine, actionError);
  if (errors.length === 0) return null;
  const Errors = layout?.formErrors ?? DefaultFormErrors;
  return <Errors rootProps={ROOT_PROPS.formErrors} errors={errors} />;
}
