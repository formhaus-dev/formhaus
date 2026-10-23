import type { FieldComponentProps } from '@formhaus/react';
import { Input } from '@chakra-ui/react';
import { FieldShell } from './shared';

const types: Record<string, string> = { email: 'email', phone: 'tel', password: 'password', time: 'time' };

export function TextField(props: FieldComponentProps) {
  const { field, value, onChange, onBlur, onFocus } = props;

  return (
    <FieldShell props={props}>
      <Input
        name={field.key}
        type={types[field.type] ?? 'text'}
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        inputMode={field.inputMode}
        autoComplete={field.autocomplete}
        onChange={(event) => onChange(event.currentTarget.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FieldShell>
  );
}
