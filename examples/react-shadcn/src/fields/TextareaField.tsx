import type { FieldComponentProps } from '@formhaus/react';
import { Textarea } from '@/components/ui/textarea';
import { FieldShell } from './FieldShell';

export function TextareaField({ id, field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <FieldShell id={id} field={field} error={error}>
      <Textarea
        id={id}
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
