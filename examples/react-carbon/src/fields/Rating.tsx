import type { ControlOption } from '@formhaus/react/controls';
import { FormGroup, IconButton } from '@carbon/react';
import { Star, StarFilled } from '@carbon/icons-react';
import { Texts } from './GroupMessage';

interface RatingProps {
  id: string;
  value: unknown;
  options: ControlOption[];
  disabled?: boolean;
  legendText: string;
  helperText?: string;
  error?: string;
  describedBy?: string;
  onChange: (value: number) => void;
  onBlur: () => void;
  onFocus: () => void;
}

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };

export function Rating({
  id,
  value,
  options,
  disabled,
  legendText,
  helperText,
  error,
  describedBy,
  onChange,
  onBlur,
  onFocus,
}: RatingProps) {
  const current = Number(value ?? 0);
  const points = options.map((option) => Number(option.value));
  const starId = (point: number) => (point === 1 ? id : `${id}-${point}`);

  return (
    <FormGroup legendText={legendText} invalid={!!error}>
      <div role="radiogroup" aria-label={legendText} aria-describedby={describedBy} style={{ display: 'flex' }}>
        {points.map((point) => (
          <IconButton
            key={point}
            id={starId(point)}
            kind="ghost"
            align="bottom"
            label={`${point} of ${points.length}`}
            role="radio"
            aria-checked={current === point}
            tabIndex={current === point || (!current && point === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(point)}
            onKeyDown={(event) => {
              if (!STEPS[event.key]) return;
              event.preventDefault();
              const next = Math.min(points.length, Math.max(1, (current || point) + STEPS[event.key]));
              onChange(next);
              document.getElementById(starId(next))?.focus();
            }}
            onBlur={onBlur}
            onFocus={onFocus}
          >
            {point <= current ? <StarFilled /> : <Star />}
          </IconButton>
        ))}
      </div>
      <Texts id={id} helperText={helperText} error={error} />
    </FormGroup>
  );
}
