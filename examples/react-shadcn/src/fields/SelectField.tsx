import type { FieldComponentProps } from '@formhaus/react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldShell } from './FieldShell';

export function SelectField({ field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  const options = field.options ?? [];
  const [open, setOpen] = useState(false);

  return (
    <FieldShell field={field} error={error}>
      <Select
        items={options}
        value={typeof value === 'string' && value !== '' ? value : null}
        disabled={disabled || loading}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onBlur();
        }}
        onValueChange={(next) => onChange(next ?? '')}
      >
        <SelectTrigger
          id={field.key}
          className="w-full"
          aria-invalid={!!error}
          onBlur={() => {
            if (!open) onBlur();
          }}
        >
          <SelectValue placeholder={field.placeholder ?? 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}
