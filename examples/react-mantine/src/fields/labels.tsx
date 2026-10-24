import type { FieldProps } from '@formhaus/react';
import { Text } from '@mantine/core';

export const labels = (f: FieldProps) => ({
  label: f.required ? (
    <>
      {f.label}
      <Text span inherit c="var(--mantine-color-error)" aria-hidden="true">
        {' *'}
      </Text>
    </>
  ) : (
    f.label
  ),
  description: f.helperText,
  error: f.error,
});
