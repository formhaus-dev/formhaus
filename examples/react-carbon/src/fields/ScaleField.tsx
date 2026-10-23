import type { FieldComponentProps } from '@formhaus/react';
import { RadioButton, RadioButtonGroup } from '@carbon/react';
import { inputProps, pick, scalePoints } from './shared';

export function ScaleField(props: FieldComponentProps) {
  const { field, value } = props;
  const { id, labelText, helperText, invalid, invalidText, disabled, onBlur, onFocus } = inputProps(props);
  const points = scalePoints(field);
  const anchor = (point?: number) => field.options?.find((option) => option.value === String(point))?.label;
  const ends = [points[0], points.at(-1)].filter((point) => anchor(point)).map((point) => `${point}: ${anchor(point)}`);
  const select = pick(props);

  return (
    <RadioButtonGroup
      legendText={labelText}
      name={field.key}
      orientation="horizontal"
      helperText={[helperText, ends.join(', ')].filter(Boolean).join('. ') || undefined}
      invalid={invalid}
      invalidText={invalidText}
      disabled={disabled}
      valueSelected={typeof value === 'number' ? String(value) : undefined}
      onChange={(next) => select(Number(next))}
    >
      {points.map((point, index) => (
        <RadioButton
          key={point}
          id={index === 0 ? id : `${id}-${point}`}
          value={String(point)}
          labelText={String(point)}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      ))}
    </RadioButtonGroup>
  );
}
