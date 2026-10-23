import type { FieldComponentProps } from '@formhaus/react';
import { ComboBox } from './ComboBox';
import { describedBy } from './field';
import { FormGroup } from './FormGroup';

export function AutocompleteField({
  id = '',
  field,
  value,
  error,
  loading,
  disabled,
  testId,
  onChange,
  onBlur,
  onFocus,
}: FieldComponentProps) {
  return (
    <FormGroup id={id} field={field} error={error}>
      <ComboBox
        id={id}
        name={field.key}
        options={field.options ?? []}
        value={typeof value === 'string' ? value : ''}
        placeholder={field.placeholder}
        autoComplete={field.autocomplete}
        invalid={!!error}
        describedBy={describedBy(id, field, error)}
        disabled={disabled || loading}
        testId={testId}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FormGroup>
  );
}
