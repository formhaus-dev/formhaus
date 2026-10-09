import type { FieldComponentProps } from '@formhaus/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function CheckboxField({ field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <div className="grid gap-2">
      <Label className="font-normal">
        <Checkbox
          id={field.key}
          checked={value === true}
          disabled={disabled || loading}
          aria-invalid={!!error}
          onCheckedChange={(checked) => onChange(checked)}
          onBlur={onBlur}
        />
        {field.label}
      </Label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
