import type { GroupComponentProps, GroupItemComponentProps } from '@formhaus/react';
import { Button, FormGroup, Layer, Stack, Tile } from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';
import { Texts } from '../fields/GroupMessage';

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
    <FormGroup id={id} legendText={label} invalid={!!error} aria-describedby={describedBy}>
      <Stack gap={5}>
        <Texts id={id} helperText={helperText} error={error} role="alert" />
        {items.map((item) => (
          <Item key={item.id} {...item} />
        ))}
        {canAdd && (
          <div>
            <Button kind="tertiary" size="md" renderIcon={Add} disabled={disabled} onClick={add} data-fh-group-add>
              {addLabel}
            </Button>
          </div>
        )}
      </Stack>
      <p className="cds--visually-hidden" role="status">
        {status}
      </p>
    </FormGroup>
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
    <Tile role="group" aria-labelledby={titleId} data-fh-group-item>
      <Layer>
        <Stack gap={5}>
          <Stack orientation="horizontal" gap={5}>
            <h3 id={titleId} tabIndex={-1} className="cds--type-heading-compact-02">
              {title}
            </h3>
            {canRemove && (
              <Button
                id={`${titleId}-remove`}
                kind="danger--ghost"
                size="sm"
                renderIcon={TrashCan}
                aria-label={removeName}
                disabled={disabled}
                onClick={requestRemove}
              >
                {removeLabel}
              </Button>
            )}
          </Stack>
          {children}
        </Stack>
      </Layer>
    </Tile>
  );
}
