import type { SectionComponentProps } from '@formhaus/react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export function Section({ id, title, description, descriptionId, columns, children }: SectionComponentProps) {
  return (
    <FormControl component="fieldset" id={id} aria-describedby={descriptionId} fullWidth sx={{ mt: 2, mb: 1 }}>
      <FormLabel component="legend" sx={{ mb: 0.5, fontWeight: 500 }}>
        {title}
      </FormLabel>
      {description && <FormHelperText id={descriptionId}>{description}</FormHelperText>}
      {columns ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                {columns.map((column) => (
                  <TableCell key={column.value} align="center">
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>{children}</TableBody>
          </Table>
        </TableContainer>
      ) : (
        children
      )}
    </FormControl>
  );
}
