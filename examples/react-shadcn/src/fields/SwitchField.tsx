import type { FieldComponentProps } from '@formhaus/react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function SwitchField({ id, field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <div className="grid gap-2">
      <Label className="font-normal">
        <Switch
          id={id}
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
