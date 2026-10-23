import type { FieldComponentProps } from '@formhaus/react';
import type { FocusEvent } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FieldShell } from './FieldShell';

export function RadioField({ id, field, value, error, loading, disabled, onChange, onBlur, matrix }: FieldComponentProps) {
  const tiles = field.options?.some((option) => option.image);
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
      <RadioGroup id={id} {...group} className={tiles ? 'grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3' : undefined}>
        {(field.options ?? []).map((option) =>
          tiles ? (
            <Label
              key={option.value}
              className="flex-col items-stretch gap-2 rounded-lg border p-2 font-normal has-[[data-checked]]:border-primary has-[[data-checked]]:ring-1 has-[[data-checked]]:ring-primary"
            >
              {option.image && <img src={option.image} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />}
              <span className="flex items-center gap-2">
                <RadioGroupItem value={option.value} />
                {option.label}
              </span>
            </Label>
          ) : (
            <Label key={option.value} className="font-normal">
              <RadioGroupItem value={option.value} />
              {option.label}
            </Label>
          ),
        )}
      </RadioGroup>
    </FieldShell>
  );
}
