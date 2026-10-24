import type { ConfirmDialogComponentProps } from '@formhaus/react';
import { Button, Dialog, Portal } from '@chakra-ui/react';

export function ConfirmDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  return (
    <Dialog.Root id={id} open={open} role="alertdialog" placement="center" onOpenChange={(details) => !details.open && cancel()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description>{description}</Dialog.Description>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={cancel}>
                {cancelLabel}
              </Button>
              <Button colorPalette="red" onClick={confirm}>
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
