import type { FieldComponentProps } from '@formhaus/react';
import { Checkbox, Field, Switch } from '@chakra-ui/react';

export function CheckboxField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const common = {
    name: field.key,
    checked: value === true,
    invalid: !!error,
    disabled: disabled || loading,
    onCheckedChange: (details: { checked: boolean | 'indeterminate' }) => onChange(details.checked === true),
  };
  const input = { id, onBlur, onFocus };

  return (
    <Field.Root invalid={!!error} disabled={disabled || loading}>
      {field.type === 'switch' ? (
        <Switch.Root {...common} ids={{ hiddenInput: id }}>
          <Switch.HiddenInput {...input} />
          <Switch.Control />
          <Switch.Label>{field.label}</Switch.Label>
        </Switch.Root>
      ) : (
        <Checkbox.Root {...common} ids={{ hiddenInput: id }}>
          <Checkbox.HiddenInput {...input} />
          <Checkbox.Control />
          <Checkbox.Label>{field.label}</Checkbox.Label>
        </Checkbox.Root>
      )}
      {field.helperText && <Field.HelperText>{field.helperText}</Field.HelperText>}
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  );
}
