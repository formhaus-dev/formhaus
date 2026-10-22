import { dividerBefore } from '@formhaus/core/internal';
import { Fragment, useContext } from 'react';
import { LabelContext } from '../labels';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { fieldId, optionProps } from './fieldProps';
import { OptionImage } from './OptionImage';

export function MultiselectField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const text = useContext(LabelContext);
  const options = field.options ?? [];
  const selected = Array.isArray(value) ? (value as (string | number)[]) : [];

  function handleToggle(optValue: string) {
    const next = selected.includes(optValue) ? selected.filter((v) => v !== optValue) : [...selected, optValue];
    onChange(next);
  }

  return (
    <FieldShell id={fieldId(props)} field={field} error={error} variant="multiselect" testId={props.testId}>
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
                onChange={() => handleToggle(opt.value)}
              />
              <label className="fh-field__multiselect-label" htmlFor={optionId}>
                {opt.label}
              </label>
              <OptionImage option={opt} />
            </div>
          </Fragment>
        );
      })}
    </FieldShell>
  );
}
