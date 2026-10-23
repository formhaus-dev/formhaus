import type { FieldComponentProps } from '@formhaus/react';
import { Checkbox, Switch } from '@mantine/core';

export function CheckboxField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const Control = field.type === 'switch' ? Switch : Checkbox;

  return (
    <Control
      id={id}
      name={field.key}
      label={field.label}
      description={field.helperText}
      error={error}
      disabled={disabled || loading}
      checked={value === true}
      onBlur={onBlur}
      onFocus={onFocus}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
  );
}
