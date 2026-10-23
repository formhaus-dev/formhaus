import type { FormField } from '@formhaus/core';
import type { FieldComponentProps } from '@formhaus/react';
import { Field, Fieldset, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface ShellProps {
  props: FieldComponentProps;
  bind?: boolean;
  children: ReactNode;
}

export function FieldShell({ props: { id, field, error, disabled, loading }, bind = true, children }: ShellProps) {
  return (
    <Field.Root id={bind ? id : undefined} invalid={!!error} disabled={disabled || loading} required={!!field.validation?.required}>
      <Field.Label>
        {field.label}
        <Field.RequiredIndicator />
      </Field.Label>
      {children}
      {field.helperText && <Field.HelperText>{field.helperText}</Field.HelperText>}
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  );
}

export function GroupShell({ props: { field, error, disabled, loading }, children }: ShellProps) {
  return (
    <Fieldset.Root invalid={!!error} disabled={disabled || loading} gap="1.5">
      <Fieldset.Legend fontSize="sm" fontWeight="medium">
        {field.label}
        {field.validation?.required && (
          <Text as="span" color="fg.error" ms="1" aria-hidden>
            *
          </Text>
        )}
      </Fieldset.Legend>
      {field.helperText && <Fieldset.HelperText textStyle="xs">{field.helperText}</Fieldset.HelperText>}
      {children}
      <Fieldset.ErrorText textStyle="xs">{error}</Fieldset.ErrorText>
    </Fieldset.Root>
  );
}

export function scalePoints(field: FormField) {
  const min = field.type === 'rating' ? 1 : (field.validation?.min ?? 1);
  const max = field.validation?.max ?? 5;
  return Array.from({ length: Math.min(11, Math.max(0, max - min + 1)) }, (_, index) => min + index);
}

export const pick = ({ field, onChange, onCommit }: FieldComponentProps) => (field.autoAdvance && onCommit) || onChange;
