import type { DefaultFieldType, FormField as FormFieldType } from '@formhaus/core';
import type { ComponentType } from 'react';
import { CheckboxField } from './fields/CheckboxField';
import { DateField } from './fields/DateField';
import { FileField } from './fields/FileField';
import { MultiselectField } from './fields/MultiselectField';
import { RadioField } from './fields/RadioField';
import { SelectField } from './fields/SelectField';
import { SwitchField } from './fields/SwitchField';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import type { FieldComponentMap, FieldComponentProps } from './types';

const defaultComponents: Record<DefaultFieldType, ComponentType<FieldComponentProps>> = {
  text: TextField,
  email: TextField,
  phone: TextField,
  number: TextField,
  password: TextField,
  select: SelectField,
  multiselect: MultiselectField,
  checkbox: CheckboxField,
  radio: RadioField,
  switch: SwitchField,
  file: FileField,
  date: DateField,
  textarea: TextareaField,
};

interface FormFieldProps {
  field: FormFieldType;
  value: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  components?: FieldComponentMap;
  onChange: (value: unknown) => void;
  onBlur: () => void;
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
}: FormFieldProps) {
  const Component = components?.[field.type] ?? (defaultComponents as Record<string, ComponentType<FieldComponentProps>>)[field.type];

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
    />
  );
}
