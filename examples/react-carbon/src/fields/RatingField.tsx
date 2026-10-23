import type { FieldComponentProps } from '@formhaus/react';
import { FormGroup, IconButton } from '@carbon/react';
import { Star, StarFilled } from '@carbon/icons-react';
import { groupProps, inputProps, pick, scalePoints } from './shared';
import { GroupMessage } from './GroupMessage';

export function RatingField(props: FieldComponentProps) {
  const { value, onChange } = props;
  const { id, labelText, disabled, onBlur, onFocus } = inputProps(props);
  const points = scalePoints(props.field);
  const current = typeof value === 'number' ? value : 0;
  const select = pick(props);

  return (
    <FormGroup {...groupProps(props)}>
      <div role="radiogroup" aria-label={labelText} style={{ display: 'flex' }}>
        {points.map((point) => (
          <IconButton
            key={point}
            id={point === points[0] ? id : `${id}-${point}`}
            kind="ghost"
            align="bottom"
            label={`${point} of ${points.length}`}
            role="radio"
            aria-checked={current === point}
            tabIndex={current === point || (!current && point === points[0]) ? 0 : -1}
            disabled={disabled}
            onClick={() => select(point)}
            onKeyDown={(event) => {
              const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
              if (!step) return;
              event.preventDefault();
              const next = Math.min(points.length, Math.max(1, (current || point) + step));
              onChange(next);
              document.getElementById(next === points[0] ? id : `${id}-${next}`)?.focus();
            }}
            onBlur={onBlur}
            onFocus={onFocus}
          >
            {point <= current ? <StarFilled /> : <Star />}
          </IconButton>
        ))}
      </div>
      <GroupMessage error={props.error} helper={props.field.helperText} />
    </FormGroup>
  );
}
