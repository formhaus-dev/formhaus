import Autocomplete from '@mui/material/Autocomplete';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import type { SyntheticEvent } from 'react';

type AutocompleteFieldProps = TextFieldProps & {
  options: string[];
  value: string;
  onInputChange: (event: SyntheticEvent, value: string) => void;
};

export function AutocompleteField({
  id,
  options,
  value,
  onInputChange,
  onBlur,
  onFocus,
  disabled,
  slotProps,
  ...field
}: AutocompleteFieldProps) {
  return (
    <Autocomplete
      freeSolo
      forcePopupIcon
      fullWidth
      id={id}
      options={options}
      value={value}
      inputValue={value}
      onInputChange={onInputChange}
      disabled={disabled}
      renderInput={({ inputProps, InputProps, InputLabelProps, ...params }) => (
        <TextField
          {...params}
          {...field}
          slotProps={{ input: InputProps, inputLabel: InputLabelProps, htmlInput: { ...inputProps, ...slotProps?.htmlInput } }}
        />
      )}
    />
  );
}
