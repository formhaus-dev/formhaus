import type { FieldProps } from '@formhaus/react';
import { Text, VisuallyHidden } from '@mantine/core';

export function Label({ f }: { f: FieldProps }) {
  return (
    <>
      {f.label}
      {f.required && (
        <Text span inherit c="var(--mantine-color-error)" aria-hidden="true">
          {' *'}
        </Text>
      )}
    </>
  );
}

export const labels = (f: FieldProps) => ({
  label: f.label,
  withAsterisk: f.required,
  description: f.helperText,
  error: f.error,
});

export const spoken = (f: FieldProps) => ({
  ...labels(f),
  label: (
    <>
      {f.label}
      {f.required && <VisuallyHidden> required</VisuallyHidden>}
    </>
  ),
});

export const marked = (f: FieldProps) => ({ label: <Label f={f} />, withAsterisk: undefined });
