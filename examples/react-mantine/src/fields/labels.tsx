import type { FieldProps } from '@formhaus/react';
import { Group, Text, VisuallyHidden } from '@mantine/core';

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

const order: ('label' | 'input' | 'description' | 'error')[] = ['label', 'input', 'description', 'error'];

const counted = (f: FieldProps, max: number) => ({
  inputWrapperOrder: order,
  description: (
    <Group component="span" justify="space-between" gap="xs" wrap="nowrap">
      <span>{f.helperText}</span>
      <span>
        {f.text.length}/{max}
      </span>
    </Group>
  ),
});

export const labels = (f: FieldProps) => ({
  label: f.label,
  withAsterisk: f.required,
  description: f.helperText,
  error: f.error,
  ...(f.maxLength && counted(f, f.maxLength)),
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
