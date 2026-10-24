import type { ConfirmDialogComponentProps } from '@formhaus/react';
import { Button, Group, Modal, Text } from '@mantine/core';

export function ConfirmDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  return (
    <Modal id={id} opened={open} onClose={cancel} title={title} centered>
      <Text size="sm">{description}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={cancel} data-autofocus>
          {cancelLabel}
        </Button>
        <Button color="red" onClick={confirm}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
