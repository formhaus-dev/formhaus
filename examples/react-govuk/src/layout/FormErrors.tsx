import type { FormErrorsComponentProps } from '@formhaus/react';

export function FormErrors({ rootProps, errors }: FormErrorsComponentProps) {
  if (!errors.length) return null;
  return (
    <div className="govuk-error-summary" data-module="govuk-error-summary" {...rootProps}>
      <h2 className="govuk-error-summary__title">There is a problem</h2>
      <div className="govuk-error-summary__body">
        <ul className="govuk-list govuk-error-summary__list">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
