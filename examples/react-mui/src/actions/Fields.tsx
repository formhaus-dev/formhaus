import type { FieldsContainerProps } from '@formhaus/react';
import Box from '@mui/material/Box';

export function Fields({ rootProps, children }: FieldsContainerProps) {
  return (
    <Box {...rootProps} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {children}
    </Box>
  );
}
