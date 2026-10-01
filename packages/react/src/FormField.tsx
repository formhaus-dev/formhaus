import type { FormField as FormFieldType } from '@formhaus/core';
import type { FieldComponentMap, FieldComponentProps } from './types';

interface FormFieldProps {
  field: FormFieldType;
  value: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  components?: FieldComponentMap;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  onFocus?: () => void;
}

export function FormField({
  field,
  value,
  error,
  loading,
  disabled,
  components,
  onChange,
  onBlur,
  onFocus,
}: FormFieldProps) {
  const Component = components?.[field.type];

  if (!Component) {
    return <div>Unsupported field type: {field.type}</div>;
  }

  return (
    <Component
      field={field}
      value={value}
      error={error}
      loading={loading}
      disabled={disabled}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  );
}
