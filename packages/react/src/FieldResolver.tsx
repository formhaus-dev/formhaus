import type { FormField as FormFieldType } from '@formhaus/core';
import type { FieldComponentMap, FieldComponentProps } from './types';

const noop = () => {};

export interface FieldResolverProps {
  id?: string;
  field: FormFieldType;
  value: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  components?: FieldComponentMap;
  onChange: (value: unknown) => void;
  onCommit?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function FieldResolver({
  id,
  field,
  value,
  error,
  loading,
  disabled,
  components,
  onChange,
  onCommit,
  onBlur,
  onFocus,
}: FieldResolverProps) {
  const Component = components?.[field.type];

  if (!Component) {
    return <div>Unsupported field type: {field.type}</div>;
  }

  return (
    <Component
      id={id}
      field={field}
      value={value}
      error={error}
      loading={loading}
      disabled={disabled}
      onChange={onChange}
      onCommit={onCommit}
      onBlur={onBlur ?? noop}
      onFocus={onFocus}
    />
  );
}
