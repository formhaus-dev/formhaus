import type { FieldComponentProps } from '@formhaus/react';
import { Input } from '@/components/ui/input';
import { FieldShell } from './FieldShell';

const inputTypes: Record<string, string> = {
  email: 'email',
  password: 'password',
  number: 'number',
  phone: 'tel',
  date: 'date',
  datetime: 'datetime-local',
  time: 'time',
};

export function TextField({ id, field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <FieldShell id={id} field={field} error={error}>
      <Input
        id={id}
        type={inputTypes[field.type] ?? 'text'}
        value={value != null ? String(value) : ''}
        placeholder={field.placeholder}
        aria-invalid={!!error}
        disabled={disabled || loading}
        onChange={(event) =>
          onChange(field.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)
        }
        onBlur={onBlur}
      />
    </FieldShell>
  );
}
