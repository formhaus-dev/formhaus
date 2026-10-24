import { toggleOption } from '@formhaus/core/fields';
import { dividerBefore, withReveals } from '@formhaus/core/internal';
import { Fragment, useContext } from 'react';
import { LabelContext } from '../labels';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { fieldId, optionProps } from './fieldProps';
import { OptionImage } from './OptionImage';
import { Reveal } from './Reveal';

export function MultiselectField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const text = useContext(LabelContext);
  const options = withReveals(field.options ?? [], props.reveals);
  const selected = Array.isArray(value) ? (value as (string | number)[]) : [];

  return (
    <FieldShell id={fieldId(props)} field={field} error={error} variant="multiselect" testId={props.testId} errorFirst={!!props.reveals}>
      {options.map((opt, index) => {
        const optionId = `${fieldId(props)}-${index}`;
        return (
          <Fragment key={opt.value}>
            {dividerBefore(field, options, index) && <div className="fh-field__option-divider">{text('or')}</div>}
            <div className="fh-field__multiselect-option">
              <input
                {...optionProps(props, opt.value)}
                id={optionId}
                name={field.key}
                type="checkbox"
                className="fh-field__checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onChange(toggleOption(value, opt.value))}
                aria-controls={opt.reveal?.id}
                aria-expanded={opt.reveal?.open}
              />
              <label className="fh-field__multiselect-label" htmlFor={optionId}>
                {opt.label}
              </label>
              <OptionImage option={opt} />
            </div>
            <Reveal reveal={opt.reveal} />
          </Fragment>
        );
      })}
    </FieldShell>
  );
}
