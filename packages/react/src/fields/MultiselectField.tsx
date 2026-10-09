import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { optionProps } from './fieldProps';

export function MultiselectField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const options = field.options ?? [];
  const selected = Array.isArray(value) ? (value as (string | number)[]) : [];

  function handleToggle(optValue: string) {
    const next = selected.includes(optValue)
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue];
    onChange(next);
  }

  return (
    <FieldShell field={field} error={error} variant="multiselect">
      {options.map((opt) => {
        const optionId = `${field.key}-${opt.value}`;
        return (
          <div key={opt.value} className="fh-field__multiselect-option">
            <input
              {...optionProps(props)}
              id={optionId}
              type="checkbox"
              className="fh-field__checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => handleToggle(opt.value)}
            />
            <label className="fh-field__multiselect-label" htmlFor={optionId}>
              {opt.label}
            </label>
          </div>
        );
      })}
    </FieldShell>
  );
}
