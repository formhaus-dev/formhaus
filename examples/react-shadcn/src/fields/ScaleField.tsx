import type { FieldComponentProps } from '@formhaus/react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FieldShell } from './FieldShell';

export function ScaleField({ id, field, value, error, loading, disabled, onChange, onCommit, onBlur }: FieldComponentProps) {
  const rating = field.type === 'rating';
  const min = rating ? 1 : (field.validation?.min ?? 1);
  const max = field.validation?.max ?? 5;
  const points = Array.from({ length: Math.min(11, Math.max(0, max - min + 1)) }, (_, index) => min + index);
  const anchor = (point: number) => field.options?.find((option) => option.value === String(point))?.label;
  const pick = field.autoAdvance && onCommit ? onCommit : onChange;
  const current = typeof value === 'number' ? value : null;

  return (
    <FieldShell id={id} field={field} error={error} group>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-invalid={!!error}
        className={rating ? 'flex gap-1' : 'grid gap-1.5'}
        style={rating ? undefined : { gridTemplateColumns: `repeat(${Math.min(points.length, 6)}, minmax(0, 1fr))` }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) onBlur();
        }}
      >
        {points.map((point) =>
          rating ? (
            <Button
              key={point}
              type="button"
              variant="ghost"
              size="icon"
              role="radio"
              aria-checked={current === point}
              aria-label={`${point} of ${max}`}
              disabled={disabled || loading}
              onClick={() => pick(point)}
            >
              <Star
                className={cn('size-6', current !== null && point <= current ? 'fill-primary text-primary' : 'text-muted-foreground')}
              />
            </Button>
          ) : (
            <Button
              key={point}
              type="button"
              variant={current === point ? 'default' : 'outline'}
              size="lg"
              role="radio"
              aria-checked={current === point}
              disabled={disabled || loading}
              onClick={() => pick(point)}
            >
              {point}
            </Button>
          ),
        )}
      </div>
      {!rating && (anchor(min) || anchor(max)) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{anchor(min)}</span>
          <span>{anchor(max)}</span>
        </div>
      )}
    </FieldShell>
  );
}
