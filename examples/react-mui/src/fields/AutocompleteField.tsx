import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { labels } from './shells';

export function AutocompleteField(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <Autocomplete
      id={f.id}
      options={f.options}
      value={f.options.find((option) => option.value === f.value) ?? null}
      onChange={(_, option) => f.change(option?.value ?? '')}
      onBlur={f.blur}
      onFocus={f.focus}
      disabled={f.disabled}
      fullWidth
      renderInput={({ inputProps, InputProps, InputLabelProps, ...params }) => (
        <TextField
          {...params}
          {...labels(f)}
          placeholder={f.placeholder}
          slotProps={{ input: InputProps, inputLabel: InputLabelProps, htmlInput: { ...inputProps, 'data-testid': f.testId } }}
        />
      )}
    />
  );
}
