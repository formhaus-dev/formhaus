import { scaleView } from '@formhaus/core/fields';
import { type CSSProperties, useRef } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { choiceHandlers, fieldId, optionProps } from './fieldProps';

export function ScaleField(props: FieldComponentProps) {
  const { field, value, error } = props;
  const id = fieldId(props);
  const { points, min, max, anchors } = scaleView(field);
  const choice = choiceHandlers(props, useRef(false), (key) => {
    const point = key === '0' && min > 0 ? 10 : Number(key);
    return /^\d$/.test(key) && point >= min && point <= max ? point : undefined;
  });

  return (
    <FieldShell id={id} field={field} error={error} variant={field.type === 'rating' ? 'rating' : 'scale'} testId={props.testId}>
      {points.map((point) => {
        const anchor = anchors.findIndex((item) => item?.point === point);
        return (
          <div key={point} className="fh-field__scale-option">
            <input
              {...optionProps(props, point)}
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
      {anchors.some(Boolean) && (
        <div className="fh-field__scale-anchors" style={{ '--fhi-scale-points': points.length } as CSSProperties}>
          {anchors.map((option, index) => (
            <span key={index} id={option && `${id}-anchor-${index}`} className="fh-field__scale-anchor">
              {option?.label}
            </span>
          ))}
        </div>
      )}
    </FieldShell>
  );
}
