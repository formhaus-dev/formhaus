import { useState, type ReactElement, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Dialog, DialogClose } from '../Dialog/Dialog';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';

function matches(typed: string, expected: string, ignoreCase: boolean) {
  const [given, want] = [typed.trim(), expected.trim()];
  if (given === '') return false;
  return ignoreCase ? given.toLowerCase() === want.toLowerCase() : given === want;
}

export interface ConfirmDialogProps {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  confirmText?: string;
  confirmDisplay?: ReactNode;
  ignoreCase?: boolean;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: (typed: string) => Promise<unknown> | undefined;
  children?: ReactNode;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = 'danger',
  confirmText,
  confirmDisplay,
  ignoreCase = false,
  trigger,
  open,
  onOpenChange,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [ownOpen, setOwnOpen] = useState(false);
  const blocked = confirmText !== undefined && !matches(typed, confirmText, ignoreCase);
  const setOpen = (next: boolean) => {
    if (!next) setTyped('');
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const confirm = async () => {
    setBusy(true);
    const done = await Promise.resolve(onConfirm(typed.trim())).then(
      () => true,
      () => false,
    );
    setBusy(false);
    if (done) setOpen(false);
  };
  return (
    <Dialog
      title={title}
      description={description}
      {...(trigger ? { trigger } : {})}
      open={open ?? ownOpen}
      onOpenChange={setOpen}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant={tone} disabled={blocked} loading={busy} onClick={() => void confirm()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {confirmText !== undefined && (
        <Field label={<>Type “{confirmDisplay ?? confirmText}” to confirm</>}>
          <Input
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      )}
    </Dialog>
  );
}
