import type { FormErrorsComponentProps } from '@formhaus/react';

export function FormErrors({ rootProps, errors }: FormErrorsComponentProps) {
  return (
    <div className="usa-alert usa-alert--error usa-alert--slim summary" {...rootProps}>
      <div className="usa-alert__body">
        {errors.map((error) => (
          <p key={error} className="usa-alert__text">
            {error}
          </p>
        ))}
      </div>
    </div>
  );
}
