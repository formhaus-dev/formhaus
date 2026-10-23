import type { GroupComponentProps, GroupItemComponentProps } from '@formhaus/react';
import { Button, Card, Fieldset, Group as Row, Stack, Text, VisuallyHidden } from '@mantine/core';

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
    <Fieldset id={id} legend={label} aria-describedby={describedBy} aria-invalid={!!error || undefined} radius="md">
      <Stack gap="sm">
        {helperText && (
          <Text id={`${id}-helper`} size="sm" c="dimmed">
            {helperText}
          </Text>
        )}
        {error && (
          <Text id={`${id}-error`} size="sm" c="red" role="alert">
            {error}
          </Text>
        )}
        {items.map((item) => (
          <Item key={item.id} {...item} />
        ))}
        {canAdd && (
          <Button variant="light" disabled={disabled} onClick={add} data-fh-group-add style={{ alignSelf: 'flex-start' }}>
            {addLabel}
          </Button>
        )}
      </Stack>
      <VisuallyHidden role="status">{status}</VisuallyHidden>
    </Fieldset>
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
    <Card withBorder radius="md" padding="md" role="group" aria-labelledby={titleId} data-fh-group-item>
      <Row justify="space-between" mb="sm">
        <Text id={titleId} tabIndex={-1} fw={500}>
          {title}
        </Text>
        {canRemove && (
          <Button
            id={`${titleId}-remove`}
            variant="subtle"
            color="red"
            size="compact-sm"
            aria-label={removeName}
            disabled={disabled}
            onClick={requestRemove}
          >
            {removeLabel}
          </Button>
        )}
      </Row>
      <Stack gap="md">{children}</Stack>
    </Card>
  );
}
