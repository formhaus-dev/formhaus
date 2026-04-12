import type { FormActionsProps } from '@formhaus/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

export function FormActions({
  primaryLabel,
  showBack,
  backLabel,
  cancelAction,
  loading,
  onPrimary,
  onPrev,
  onCancel,
}: FormActionsProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, pt: 2 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {showBack && (
          <Button variant="outlined" disabled={loading} onClick={onPrev}>
            {backLabel}
          </Button>
        )}
        {cancelAction && (
          <Button variant="text" disabled={loading} onClick={onCancel}>
            {cancelAction.label}
          </Button>
        )}
      </Box>
      <Button variant="contained" disabled={loading} onClick={onPrimary}>
        {primaryLabel}
      </Button>
    </Box>
  );
}
