import type { ConfirmDialogComponentProps, GroupComponentProps, GroupItemComponentProps } from '@formhaus/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const hidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' } as const;

export function Group({
  id,
  label,
  helperText,
  error,
  describedBy,
  items,
  canAdd,
  add,
  addLabel,
  disabled,
  status,
  itemComponent: Item,
}: GroupComponentProps) {
  return (
    <FormControl component="fieldset" id={id} error={!!error} aria-describedby={describedBy} fullWidth sx={{ mt: 2, mb: 1 }}>
      <FormLabel component="legend" sx={{ fontWeight: 500, mb: 0.5 }}>
        {label}
      </FormLabel>
      {helperText && (
        <FormHelperText id={`${id}-helper`} sx={{ mx: 0, mt: 0, mb: 1.5 }}>
          {helperText}
        </FormHelperText>
      )}
      {error && (
        <FormHelperText id={`${id}-error`} sx={{ mx: 0, mt: 0, mb: 1.5 }}>
          {error}
        </FormHelperText>
      )}
      <Stack spacing={2}>
        {items.map((item) => (
          <Item key={item.id} {...item} />
        ))}
        {canAdd && (
          <Button variant="outlined" disabled={disabled} onClick={add} sx={{ alignSelf: 'flex-start' }}>
            {addLabel}
          </Button>
        )}
      </Stack>
      <Box role="status" sx={hidden}>
        {status}
      </Box>
    </FormControl>
  );
}

export function GroupItem({
  title,
  titleId,
  canRemove,
  requestRemove,
  removeLabel,
  removeName,
  disabled,
  children,
}: GroupItemComponentProps) {
  return (
    <Card variant="outlined" role="group" aria-labelledby={titleId}>
      <CardHeader
        sx={{ pb: 0 }}
        title={
          <Typography id={titleId} tabIndex={-1} variant="subtitle1" fontWeight={500}>
            {title}
          </Typography>
        }
        action={
          canRemove && (
            <Button id={`${titleId}-remove`} size="small" color="error" disabled={disabled} aria-label={removeName} onClick={requestRemove}>
              {removeLabel}
            </Button>
          )
        }
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ConfirmDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  return (
    <Dialog id={id} open={open} onClose={cancel} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${id}-description`}>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancel}>{cancelLabel}</Button>
        <Button color="error" variant="contained" onClick={confirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
