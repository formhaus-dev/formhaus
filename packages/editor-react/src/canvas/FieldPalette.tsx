import type { ReactElement } from 'react';
import { CommandList, Popover, Sheet } from '../ui';
import { paletteItems } from '../fieldTypes';
import { phone, useMedia } from '../useMedia';
import { addItems } from './presets';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (id: string) => void;
  trigger?: ReactElement;
  anchor?: ReactElement;
  label?: string;
  adding?: boolean;
}

export function FieldPalette({ open, onOpenChange, onPick, trigger, anchor, label = 'Field types', adding = false }: Props) {
  const small = useMedia(phone);
  const list = (
    <CommandList
      items={adding ? addItems : paletteItems}
      label={label}
      layout="grid"
      placeholder="Search field types"
      autoFocus={!small}
      onSelect={(id) => {
        onPick(id);
        onOpenChange(false);
      }}
      onEscape={() => {
        onOpenChange(false);
      }}
    />
  );
  if (small) {
    return (
      <>
        {trigger && (
          <span
            onClickCapture={() => {
              onOpenChange(true);
            }}
          >
            {trigger}
          </span>
        )}
        {anchor}
        <Sheet title={label} open={open} onOpenChange={onOpenChange}>
          {list}
        </Sheet>
      </>
    );
  }
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      label={label}
      width="canvas"
      flush
      {...(trigger ? { trigger } : {})}
      {...(anchor ? { anchor } : {})}
    >
      {list}
    </Popover>
  );
}
