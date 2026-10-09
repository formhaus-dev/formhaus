import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

export function AutocompleteField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const listId = `${field.key}-list`;
  const options = field.options ?? [];

  return (
    <FieldShell field={field} error={error}>
      <input
        {...inputProps(props)}
        type="text"
        list={listId}
        className="fh-field__input fh-field__input--autocomplete"
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </datalist>
    </FieldShell>
  );
}
