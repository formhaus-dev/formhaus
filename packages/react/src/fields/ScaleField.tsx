import { scaleRange } from '@formhaus/core/internal';
import { type CSSProperties, useRef } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { choiceHandlers, fieldId, optionProps } from './fieldProps';

export function ScaleField(props: FieldComponentProps) {
  const { field, value, error } = props;
  const id = fieldId(props);
  const [min, max] = scaleRange(field);
  const points = Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => min + index);
  const anchors = (field.options ?? []).slice(0, 3);
  const choice = choiceHandlers(props, useRef(false), (key) => {
    const point = key === '0' && min ? 10 : Number(key);
    return /^\d$/.test(key) && point >= min && point <= max ? point : undefined;
  });

  return (
    <FieldShell id={id} field={field} error={error} variant={field.type === 'rating' ? 'rating' : 'scale'}>
      {points.map((point) => {
        const anchor = anchors.findIndex((option) => option.value === String(point));
        return (
          <div key={point} className="fh-field__scale-option">
            <input
              {...optionProps(props)}
              {...choice(point)}
              id={`${id}-${point}`}
              type="radio"
              className="fh-field__scale-input"
              name={field.key}
              value={point}
              checked={String(value) === String(point)}
              aria-describedby={anchor < 0 ? undefined : `${id}-anchor-${anchor}`}
            />
            <label className="fh-field__scale-label" htmlFor={`${id}-${point}`}>
              {point}
            </label>
          </div>
        );
      })}
      {anchors.length > 0 && (
        <div className="fh-field__scale-anchors" style={{ '--fh-scale-points': points.length } as CSSProperties}>
          {anchors.map((option, index) => (
            <span key={option.value} id={`${id}-anchor-${index}`} className="fh-field__scale-anchor">
              {option.label}
            </span>
          ))}
        </div>
      )}
    </FieldShell>
  );
}
