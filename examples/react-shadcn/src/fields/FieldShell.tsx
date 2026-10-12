import type { FormField } from '@formhaus/core';
import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface FieldShellProps {
  id?: string;
  field: FormField;
  error?: string;
  group?: boolean;
  children: ReactNode;
}

export function FieldShell({ id, field, error, group, children }: FieldShellProps) {
  return (
    <div className="grid gap-2">
      <Label id={`${id}-label`} htmlFor={group ? undefined : id}>
        {field.label}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : field.helperText ? (
        <p className="text-sm text-muted-foreground">{field.helperText}</p>
      ) : null}
    </div>
  );
}
