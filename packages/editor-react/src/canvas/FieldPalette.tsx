import { useRef, type ReactElement } from 'react';
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
  const picked = useRef<string | null>(null);
  const list = (
    <CommandList
      items={adding ? addItems : paletteItems}
      label={label}
      layout="grid"
      placeholder="Search field types"
      autoFocus={!small}
      onSelect={(id) => {
        if (small) picked.current = id;
        else onPick(id);
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
        <Sheet
          title={label}
          open={open}
          onOpenChange={onOpenChange}
          onClosed={() => {
            const id = picked.current;
            if (!id) return false;
            picked.current = null;
            onPick(id);
            requestAnimationFrame(() => {
              if (document.activeElement instanceof HTMLElement) document.activeElement.scrollIntoView({ block: 'center' });
            });
            return true;
          }}
        >
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
      capped
      {...(trigger ? { trigger } : {})}
      {...(anchor ? { anchor } : {})}
    >
      {list}
    </Popover>
  );
}
