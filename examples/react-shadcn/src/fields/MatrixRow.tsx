import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <RadioGroup
      data-fh="field"
      id={f.id}
      aria-labelledby={`${f.id}-label`}
      aria-describedby={f.describedBy}
      aria-invalid={f.aria['aria-invalid']}
      value={f.value ?? null}
      disabled={f.disabled}
      onValueChange={f.change}
      onBlur={f.blur}
      className="grid items-center gap-0 border-b last:border-b-0 [grid-template-columns:var(--matrix)]"
    >
      <span className="px-3 py-2.5 text-sm">
        <span id={`${f.id}-label`}>{f.label}</span>
        {f.helperText && (
          <span id={f.helperId} className="block text-xs text-muted-foreground">
            {f.helperText}
          </span>
        )}
        {f.error && (
          <span id={f.errorId} className="block text-xs text-destructive">
            {f.error}
          </span>
        )}
      </span>
      {f.options.map((column) => (
        <span key={column.value} className="flex justify-center py-2.5">
          <RadioGroupItem value={column.value} aria-label={column.label} />
        </span>
      ))}
    </RadioGroup>
  );
}
