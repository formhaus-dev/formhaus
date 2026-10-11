import type { FieldComponentProps } from '@formhaus/react';
import { Textarea } from '@/components/ui/textarea';
import { FieldShell } from './FieldShell';

export function TextareaField({ field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <FieldShell field={field} error={error}>
      <Textarea
        id={field.key}
        rows={field.rows}
        value={typeof value === 'string' ? value : ''}
        placeholder={field.placeholder}
        aria-invalid={!!error}
        disabled={disabled || loading}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}
