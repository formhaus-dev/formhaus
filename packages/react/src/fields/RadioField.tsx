import { withReveals } from '@formhaus/core/internal';
import { Fragment, useRef } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { choiceHandlers, choiceProps, fieldId } from './fieldProps';
import { OptionText } from './OptionText';
import { Reveal } from './Reveal';

export function RadioField(props: FieldComponentProps) {
  const { field, value, error } = props;
  const choice = choiceHandlers(props, useRef(false));

  return (
    <FieldShell
      id={fieldId(props)}
      field={field}
      error={error}
      variant="radio"
      testId={props.testId}
      errorFirst={!!props.reveals}
      readOnly={props.readOnly}
    >
      {withReveals(field.options ?? [], props.reveals).map((opt, index) => {
        const optionId = `${fieldId(props)}-${index}`;
        return (
          <Fragment key={opt.value}>
            <div className="fh-field__radio-option">
              <input
                {...choiceProps(props, opt, optionId)}
                {...choice(opt.value)}
                autoComplete={field.autocomplete}
                type="radio"
                className="fh-field__radio"
                name={field.key}
                value={opt.value}
                checked={String(value) === String(opt.value)}
                aria-controls={opt.reveal?.id}
              />
              <OptionText option={opt} id={optionId} variant="radio" />
            </div>
            <Reveal reveal={opt.reveal} />
          </Fragment>
        );
      })}
    </FieldShell>
  );
}
