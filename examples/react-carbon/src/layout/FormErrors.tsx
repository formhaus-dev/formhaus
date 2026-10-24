import type { FormErrorsComponentProps } from '@formhaus/react';
import { InlineNotification } from '@carbon/react';

export function FormErrors({ rootProps, errors }: FormErrorsComponentProps) {
  const { role: _role, ...root } = rootProps;

  return (
    <InlineNotification
      kind="error"
      role="alert"
      lowContrast
      hideCloseButton
      style={{ marginBlockStart: '2rem' }}
      title={errors[0]}
      subtitle={errors.slice(1).join(' ')}
      {...root}
    />
  );
}
