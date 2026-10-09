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
};

export function TextField({ field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <FieldShell field={field} error={error}>
      <Input
        id={field.key}
        type={inputTypes[field.type] ?? 'text'}
        value={value != null ? String(value) : ''}
        placeholder={field.placeholder}
        aria-invalid={!!error}
        disabled={disabled || loading}
        onChange={(event) => onChange(field.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}
