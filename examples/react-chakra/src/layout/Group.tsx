import type { GroupComponentProps, GroupItemComponentProps } from '@formhaus/react';
import { Button, Card, Fieldset, HStack, Stack, Text, VisuallyHidden } from '@chakra-ui/react';

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
    <Fieldset.Root id={id} invalid={!!error} aria-describedby={describedBy}>
      <Stack gap="1">
        <Fieldset.Legend>{label}</Fieldset.Legend>
        {helperText && <Fieldset.HelperText id={`${id}-helper`}>{helperText}</Fieldset.HelperText>}
        {error && (
          <Text id={`${id}-error`} textStyle="sm" color="fg.error" role="alert">
            {error}
          </Text>
        )}
      </Stack>
      {items.map((item) => (
        <Item key={item.id} {...item} />
      ))}
      {canAdd && (
        <Button variant="subtle" alignSelf="flex-start" disabled={disabled} onClick={add} data-fh-group-add>
          {addLabel}
        </Button>
      )}
      <VisuallyHidden role="status">{status}</VisuallyHidden>
    </Fieldset.Root>
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
    <Card.Root variant="outline" role="group" aria-labelledby={titleId} data-fh-group-item>
      <Card.Header>
        <HStack justify="space-between">
          <Card.Title id={titleId} tabIndex={-1} textStyle="md">
            {title}
          </Card.Title>
          {canRemove && (
            <Button
              id={`${titleId}-remove`}
              variant="ghost"
              colorPalette="red"
              size="sm"
              aria-label={removeName}
              disabled={disabled}
              onClick={requestRemove}
            >
              {removeLabel}
            </Button>
          )}
        </HStack>
      </Card.Header>
      <Card.Body>
        <Stack gap="6">{children}</Stack>
      </Card.Body>
    </Card.Root>
  );
}
