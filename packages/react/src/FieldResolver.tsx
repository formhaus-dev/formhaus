import type { FormField as FormFieldType } from '@formhaus/core';
import type { ComponentType } from 'react';
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
  testId?: string;
  optionTestId?: (value: string) => string | undefined;
}

export function FieldResolver({ components, onBlur, ...props }: FieldResolverProps) {
  const Component = components?.[props.field.type] as ComponentType<FieldComponentProps> | undefined;

  if (!Component) {
    let typeName = '';
    try {
      if (process.env.NODE_ENV !== 'production') typeName = `: ${props.field.type}`;
    } catch {}
    return <div className="fh-field--unsupported">Unsupported field type{typeName}</div>;
  }

  return <Component {...props} onBlur={onBlur ?? noop} />;
}
