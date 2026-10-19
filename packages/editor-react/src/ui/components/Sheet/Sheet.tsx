import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import styles from './Sheet.module.css';
import { useReturnFocus } from '../Dialog/useReturnFocus';
import { layer } from '../../lib/layer';

export type SheetDetent = 'medium' | 'large';

export interface SheetProps {
  title: ReactNode;
  description?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
  footer?: ReactNode;
  detent?: SheetDetent;
  onDetentChange?: (detent: SheetDetent) => void;
  onClosed?: () => boolean;
}

const SWIPE = 40;

export function Sheet({ title, description, open, onOpenChange, children, footer, detent, onDetentChange, onClosed }: SheetProps) {
  const [own, setOwn] = useState<SheetDetent>('medium');
  const current = detent ?? own;
  const start = useRef<number | null>(null);
  const focus = useReturnFocus();

  function change(next: SheetDetent) {
    setOwn(next);
    onDetentChange?.(next);
  }

  function release(event: PointerEvent<HTMLButtonElement>) {
    const from = start.current;
    start.current = null;
    if (from === null) return;
    const delta = event.clientY - from;
    if (delta < -SWIPE) change('large');
    else if (delta > SWIPE && current === 'large') change('medium');
    else if (delta > SWIPE) onOpenChange(false);
    else change(current === 'large' ? 'medium' : 'large');
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay {...layer} className={styles.overlay} />
        <RadixDialog.Content
          {...layer}
          className={cx(styles.sheet, styles[current])}
          data-detent={current}
          onOpenAutoFocus={focus.remember}
          onCloseAutoFocus={(event) => {
            if (onClosed?.()) {
              event.preventDefault();
              return;
            }
            focus.onCloseAutoFocus(event);
          }}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <button
            type="button"
            className={styles.grabber}
            aria-label={current === 'large' ? 'Collapse sheet' : 'Expand sheet'}
            onPointerDown={(event) => {
              start.current = event.clientY;
            }}
            onPointerUp={release}
            onPointerCancel={() => {
              start.current = null;
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              change(current === 'large' ? 'medium' : 'large');
            }}
          >
            <span className={styles.bar} aria-hidden />
          </button>
          <header className={styles.header}>
            <div className={styles.heading}>
              <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
              {description && <RadixDialog.Description className={styles.description}>{description}</RadixDialog.Description>}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Close" icon={<X aria-hidden />} />
            </RadixDialog.Close>
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
