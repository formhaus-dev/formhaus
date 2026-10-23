import { AlertDialog } from '@base-ui/react/alert-dialog';
import type { ConfirmDialogComponentProps, GroupComponentProps, GroupItemComponentProps } from '@formhaus/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <fieldset id={id} aria-describedby={describedBy} aria-invalid={!!error || undefined} className="grid gap-3">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {helperText && (
        <p id={`${id}-helper`} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {items.map((item) => (
        <Item key={item.id} {...item} />
      ))}
      {canAdd && (
        <Button type="button" variant="outline" className="justify-self-start" disabled={disabled} onClick={add}>
          {addLabel}
        </Button>
      )}
      <p className="sr-only" role="status">
        {status}
      </p>
    </fieldset>
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
    <Card role="group" aria-labelledby={titleId} size="sm">
      <CardHeader className="flex items-center justify-between">
        <CardTitle id={titleId} tabIndex={-1}>
          {title}
        </CardTitle>
        {canRemove && (
          <Button
            id={`${titleId}-remove`}
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label={removeName}
            onClick={requestRemove}
          >
            {removeLabel}
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
  );
}

export function ConfirmDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && cancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black/40" />
        <AlertDialog.Popup
          id={id}
          className="fixed top-1/2 left-1/2 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-3 rounded-xl border bg-background p-6 text-foreground shadow-lg"
        >
          <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-muted-foreground">{description}</AlertDialog.Description>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancel}>
              {cancelLabel}
            </Button>
            <Button type="button" variant="destructive" onClick={confirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
