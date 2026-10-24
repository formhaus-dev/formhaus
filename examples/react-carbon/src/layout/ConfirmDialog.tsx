import type { ConfirmDialogComponentProps } from '@formhaus/react';
import { Modal } from '@carbon/react';

export function ConfirmDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  return (
    <Modal
      id={id}
      open={open}
      danger
      alert
      size="xs"
      modalHeading={title}
      primaryButtonText={confirmLabel}
      secondaryButtonText={cancelLabel}
      onRequestClose={cancel}
      onRequestSubmit={confirm}
      onSecondarySubmit={cancel}
    >
      <p>{description}</p>
    </Modal>
  );
}
