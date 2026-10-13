import * as RadixPopover from '@radix-ui/react-popover';
import type { ReactElement, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Popover.module.css';

export interface PopoverProps {
  children: ReactNode;
  trigger?: ReactElement;
  anchor?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  label?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  width?: 'auto' | 'menu' | 'wide' | 'canvas';
  flush?: boolean;
  capped?: boolean;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

export function Popover({
  children,
  trigger,
  anchor,
  open,
  onOpenChange,
  label,
  side = 'bottom',
  align = 'start',
  width = 'auto',
  flush = false,
  capped = false,
  onOpenAutoFocus,
  onCloseAutoFocus,
}: PopoverProps) {
  const state = open === undefined ? {} : { open };
  return (
    <RadixPopover.Root {...state} {...(onOpenChange ? { onOpenChange } : {})}>
      {trigger && <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>}
      {anchor && <RadixPopover.Anchor asChild>{anchor}</RadixPopover.Anchor>}
      <RadixPopover.Portal>
        <RadixPopover.Content
          className={cx(styles.content, styles[width], flush && styles.flush, capped && styles.capped)}
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          aria-label={label}
          {...(onOpenAutoFocus ? { onOpenAutoFocus } : {})}
          {...(onCloseAutoFocus ? { onCloseAutoFocus } : {})}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export const PopoverClose = RadixPopover.Close;
