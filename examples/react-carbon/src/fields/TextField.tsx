import type { FieldComponentProps } from '@formhaus/react';
import { PasswordInput, TextInput } from '@carbon/react';
import type { ChangeEvent } from 'react';
import { inputProps } from './shared';

const types: Record<string, string> = { email: 'email', phone: 'tel' };

export function TextField(props: FieldComponentProps) {
  const { field, value, onChange } = props;
  const common = {
    ...inputProps(props),
    value: (value as string) ?? '',
    placeholder: field.placeholder,
    inputMode: field.inputMode,
    autoComplete: field.autocomplete,
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value),
  };

  if (field.type === 'password') return <PasswordInput {...common} />;
  return <TextInput {...common} type={types[field.type] ?? 'text'} />;
}
