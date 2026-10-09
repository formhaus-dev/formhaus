import type { FieldComponentProps } from '@formhaus/react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FieldShell } from './FieldShell';

export function RadioField({ field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <FieldShell field={field} error={error} group>
      <RadioGroup
        id={field.key}
        aria-labelledby={`${field.key}-label`}
        value={typeof value === 'string' ? value : null}
        disabled={disabled || loading}
        aria-invalid={!!error}
        onValueChange={(next) => onChange(next)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) onBlur();
        }}
      >
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
