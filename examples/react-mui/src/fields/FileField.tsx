import type { FieldComponentProps } from '@formhaus/react';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';

export function FileField({
  field,
  error,
  loading,
  disabled,
  onChange,
}: FieldComponentProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    onChange(files && files.length > 0 ? files[0] : null);
  }

  return (
    <div style={{ marginTop: 16, marginBottom: 8 }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'rgba(0,0,0,0.6)' }}>
        {field.label}
      </label>
      <Button variant="outlined" component="label" disabled={disabled || loading}>
        Choose file
        <input
          id={field.key}
          type="file"
          accept={field.accept}
          hidden
          onChange={handleChange}
        />
      </Button>
      {error && <FormHelperText error>{error}</FormHelperText>}
      {!error && field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
    </div>
  );
}
