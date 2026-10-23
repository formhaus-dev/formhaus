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
  const errors = actionError ? [...engine.topLevelErrors, actionError] : engine.topLevelErrors;
  if (errors.length === 0) return null;
  const Errors = layout?.formErrors ?? DefaultFormErrors;
  return <Errors rootProps={ROOT_PROPS.formErrors} errors={errors} />;
}
