import type { FieldComponentProps } from '@formhaus/react';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableRow from '@mui/material/TableRow';

export function RadioField({ id, field, value, error, loading, disabled, onChange, matrix }: FieldComponentProps) {
  if (matrix) {
    return (
      <TableRow role="radiogroup" aria-labelledby={`${id}-label`}>
        <TableCell component="th" scope="row" id={`${id}-label`}>
          {field.label}
          {error && <FormHelperText error>{error}</FormHelperText>}
        </TableCell>
        {matrix.columns.map((column) => (
          <TableCell key={column.value} align="center" padding="checkbox">
            <Radio
              name={id}
              value={column.value}
              checked={value === column.value}
              disabled={disabled || loading}
              inputProps={{ 'aria-label': column.label }}
              onChange={() => onChange(column.value)}
            />
          </TableCell>
        ))}
      </TableRow>
    );
  }

  const options = field.options ?? [];
  const tiles = options.some((option) => option.image);

  return (
    <FormControl error={!!error} disabled={disabled || loading} fullWidth={tiles} sx={{ mt: 1, mb: 0.5 }}>
      <FormLabel id={`${id}-label`}>{field.label}</FormLabel>
      <RadioGroup
        aria-labelledby={`${id}-label`}
        value={(value as string) ?? ''}
        sx={tiles ? { display: 'block' } : undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        {tiles ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5, mt: 1 }}>
            {options.map((opt) => (
              <Card
                key={opt.value}
                component="label"
                variant="outlined"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  borderColor: value === opt.value ? 'primary.main' : undefined,
                  boxShadow: value === opt.value ? (theme) => `inset 0 0 0 1px ${theme.palette.primary.main}` : undefined,
                }}
              >
                {opt.image && (
                  <CardMedia
                    component="img"
                    image={opt.image}
                    alt=""
                    sx={{ width: '100%', height: 'auto', aspectRatio: '4 / 3', objectFit: 'cover', flex: 'none' }}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
                  <Radio value={opt.value} />
                  <Typography>{opt.label}</Typography>
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          options.map((opt) => <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />)
        )}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
      {!error && field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
    </FormControl>
  );
}
