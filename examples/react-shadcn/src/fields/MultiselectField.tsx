import type { FieldComponentProps } from '@formhaus/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FieldShell } from './FieldShell';

export function MultiselectField({ id, field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  const selected = Array.isArray(value) ? (value as string[]) : [];

  function toggle(option: string, checked: boolean) {
    onChange(checked ? [...selected, option] : selected.filter((item) => item !== option));
  }

  return (
    <FieldShell id={id} field={field} error={error} group>
      <div role="group" aria-labelledby={`${id}-label`} className="grid gap-2">
        {(field.options ?? []).map((option) => (
          <Label key={option.value} className="font-normal">
            <Checkbox
              checked={selected.includes(option.value)}
              disabled={disabled || loading}
              aria-invalid={!!error}
              onCheckedChange={(checked) => toggle(option.value, checked)}
              onBlur={onBlur}
            />
            {option.label}
          </Label>
        ))}
      </div>
    </FieldShell>
  );
}
