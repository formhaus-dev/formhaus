import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { useRef } from 'react';
import { Texts } from './shells';

export function FileField(props: FieldComponentProps) {
  const f = fieldProps(props);
  const input = useRef<HTMLInputElement>(null);
  const { id, 'aria-describedby': describedBy, ...attrs } = f.attrs;
  return (
    <FormControl data-fh="field" error={f.invalid} margin="normal">
      <FormLabel id={`${id}-label`} required={f.required} sx={{ mb: 0.5 }}>
        {f.label}
      </FormLabel>
      <Button
        id={id}
        variant="outlined"
        disabled={f.disabled}
        aria-labelledby={`${id}-label ${id}`}
        aria-describedby={describedBy}
        onClick={() => input.current?.click()}
        sx={{ alignSelf: 'flex-start' }}
      >
        Choose file
      </Button>
      <input
        {...attrs}
        ref={input}
        type="file"
        accept={props.field.accept}
        hidden
        onChange={(event) => f.change(event.target.files?.[0] ?? null)}
      />
      <Texts f={f} />
    </FormControl>
  );
}
