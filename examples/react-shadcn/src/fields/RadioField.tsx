import type { FieldComponentProps } from '@formhaus/react';
import type { FocusEvent } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FieldShell } from './FieldShell';

export function RadioField({ id, field, value, error, loading, disabled, onChange, onBlur, matrix }: FieldComponentProps) {
  const group = {
    'aria-labelledby': `${id}-label`,
    value: typeof value === 'string' ? value : null,
    disabled: disabled || loading,
    'aria-invalid': !!error,
    onValueChange: (next: unknown) => onChange(next),
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) onBlur();
    },
  };

  if (matrix) {
    return (
      <RadioGroup id={id} {...group} className="grid items-center gap-0 border-b last:border-b-0 [grid-template-columns:var(--matrix)]">
        <span id={`${id}-label`} className="px-3 py-2.5 text-sm">
          {field.label}
          {error && <span className="block text-xs text-destructive">{error}</span>}
        </span>
        {matrix.columns.map((column) => (
          <span key={column.value} className="flex justify-center py-2.5">
            <RadioGroupItem value={column.value} aria-label={column.label} />
          </span>
        ))}
      </RadioGroup>
    );
  }

  return (
    <FieldShell id={id} field={field} error={error} group>
      <RadioGroup id={id} {...group}>
        {(field.options ?? []).map((option) => (
          <Label key={option.value} className="font-normal">
            <RadioGroupItem value={option.value} />
            {option.label}
          </Label>
        ))}
      </RadioGroup>
    </FieldShell>
  );
}
