import type { ConfirmDialogComponentProps, GroupComponentProps, GroupItemComponentProps } from '@formhaus/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldDescription, FieldError, FieldLegend, FieldSet } from '@/components/ui/field';

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
    <FieldSet
      id={id}
      aria-describedby={describedBy}
      aria-invalid={!!error || undefined}
      data-invalid={!!error || undefined}
      className="gap-3"
    >
      <FieldLegend variant="label" className={error ? 'text-destructive' : undefined}>
        {label}
      </FieldLegend>
      {helperText && <FieldDescription id={`${id}-helper`}>{helperText}</FieldDescription>}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
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
    </FieldSet>
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
    <AlertDialog open={open} onOpenChange={(next) => !next && cancel()}>
      <AlertDialogContent id={id}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
