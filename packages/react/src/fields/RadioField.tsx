import { useRef } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { choiceHandlers, fieldId, optionProps } from './fieldProps';
import { OptionImage } from './OptionImage';

export function RadioField(props: FieldComponentProps) {
  const { field, value, error } = props;
  const choice = choiceHandlers(props, useRef(false));

  return (
    <FieldShell id={fieldId(props)} field={field} error={error} variant="radio">
      {(field.options ?? []).map((opt, index) => {
        const optionId = `${fieldId(props)}-${index}`;
        return (
          <div key={opt.value} className="fh-field__radio-option">
            <OptionImage option={opt} />
            <input
              {...optionProps(props)}
              {...choice(opt.value)}
              id={optionId}
              type="radio"
              className="fh-field__radio"
              name={field.key}
              value={opt.value}
              checked={String(value) === String(opt.value)}
            />
            <label className="fh-field__radio-label" htmlFor={optionId}>
              {opt.label}
            </label>
          </div>
        );
      })}
    </FieldShell>
  );
}
