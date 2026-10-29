import { addFiles, fileEntries, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlShellProps } from '@formhaus/react/controls';
import Box from '@mui/material/Box';
import Button, { type ButtonProps } from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { type InputHTMLAttributes, type ReactElement, useState } from 'react';

const helper = (f: FieldProps) =>
  f.maxLength ? (
    <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <span>{f.error ?? f.helperText}</span>
      <span>
        {f.text.length}/{f.maxLength}
      </span>
    </Box>
  ) : (
    (f.error ?? f.helperText)
  );

export const labels = (f: FieldProps) => ({
  label: f.label,
  required: f.required,
  error: f.invalid,
  helperText: helper(f),
  fullWidth: true,
  margin: 'normal' as const,
  'data-testid': undefined,
  slotProps: {
    inputLabel: { shrink: f.inputType.includes('date') || f.inputType === 'time' || undefined },
    htmlInput: { 'data-testid': f.testId },
  },
});

export const describedBy = (f: FieldProps) => (f.error ? f.errorId : f.helperText ? f.helperId : undefined);

export function Texts({ f }: Pick<ControlShellProps, 'f'>) {
  const text = f.error ?? f.helperText;
  return text ? <FormHelperText id={f.error ? f.errorId : f.helperId}>{text}</FormHelperText> : null;
}

export function InlineShell({ f, rootProps, children }: ControlShellProps) {
  return (
    <FormControl {...rootProps} variant="standard" error={f.invalid} sx={{ mt: 1, mb: 0.5 }}>
      <FormControlLabel control={children as ReactElement} label={f.label} required={f.required} />
      <Texts f={f} />
    </FormControl>
  );
}

export function GroupShell({ field, f, rootProps, anchors, children }: ControlShellProps) {
  const inline = field.layout === 'inline' && { '& > .MuiFormGroup-root': { flexDirection: 'row', flexWrap: 'wrap' } };
  return (
    <FormControl
      {...rootProps}
      aria-describedby={describedBy(f)}
      component="fieldset"
      variant="standard"
      error={f.invalid}
      fullWidth
      sx={{ mt: 1, mb: 0.5, ...inline }}
    >
      <FormLabel component="legend" required={f.required} sx={{ mb: 0.5 }}>
        {f.label}
      </FormLabel>
      {children}
      {anchors.some(Boolean) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          {anchors.map((anchor, index) => (
            <Typography key={index} variant="caption" color="text.secondary">
              {anchor?.label}
            </Typography>
          ))}
        </Box>
      )}
      <Texts f={f} />
    </FormControl>
  );
}

export function FileShell({ f, rootProps, children }: ControlShellProps) {
  return (
    <FormControl {...rootProps} variant="standard" error={f.invalid} margin="normal">
      <FormLabel id={`${f.id}-label`} required={f.required} sx={{ mb: 0.5 }}>
        {f.label}
      </FormLabel>
      {children}
      <Texts f={f} />
    </FormControl>
  );
}

const HiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

type FilePickerProps = ButtonProps<'label'> &
  Pick<InputHTMLAttributes<HTMLInputElement>, 'name' | 'accept' | 'multiple' | 'onChange'> & {
    f: FieldProps;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
    'data-testid'?: string;
  };

export function FilePicker({ f, id, name, accept, multiple, onChange, disabled, 'data-testid': testId, ...aria }: FilePickerProps) {
  const [file, setFile] = useState('');
  const entries = multiple ? fileEntries(f.value) : [];
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Button
          component="label"
          id={`${id}-button`}
          variant="outlined"
          disabled={disabled}
          sx={{ '&:focus-within': { outline: 2, outlineColor: 'primary.main', outlineOffset: 2 } }}
        >
          {multiple ? 'Add files' : 'Choose file'}
          <HiddenInput
            id={id}
            type="file"
            name={name}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            data-testid={testId}
            aria-labelledby={aria['aria-labelledby']}
            aria-describedby={aria['aria-describedby']}
            aria-invalid={aria['aria-invalid']}
            aria-required={aria['aria-required']}
            onChange={(event) => {
              if (!multiple) {
                setFile(event.target.files?.[0]?.name ?? '');
                return onChange?.(event);
              }
              const picked = Array.from(event.target.files ?? []);
              event.target.value = '';
              if (picked.length) f.change(addFiles(f.value, picked));
            }}
          />
        </Button>
        {file && <Typography variant="body2">{file}</Typography>}
      </Box>
      {entries.length > 0 && (
        <List dense disablePadding sx={{ mt: 1 }}>
          {entries.map(({ index, name }) => (
            <ListItem
              key={index}
              divider
              disableGutters
              secondaryAction={
                <Button
                  size="small"
                  color="error"
                  aria-label={`Remove ${name}`}
                  disabled={disabled}
                  onClick={() => f.change(removeFile(f.value, index))}
                >
                  Remove
                </Button>
              }
            >
              <ListItemText primary={name} slotProps={{ primary: { sx: { overflowWrap: 'anywhere' } } }} />
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
}
