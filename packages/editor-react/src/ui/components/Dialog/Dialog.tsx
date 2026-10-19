import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import styles from './Dialog.module.css';
import { useReturnFocus } from './useReturnFocus';
import { layer } from '../../lib/layer';

export interface DialogProps {
  title: ReactNode;
  description?: ReactNode;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  footer?: ReactNode;
  actions?: ReactNode;
  onCloseAutoFocus?: (event: Event) => void;
  children?: ReactNode;
  placement?: 'center' | 'right' | 'left';
  dismissible?: boolean;
}

const fieldSelector = 'input:not([type=hidden]), textarea, select, [data-autofocus]';

const stay = (event: Event) => {
  event.preventDefault();
};

function focusFirstField(event: Event) {
  event.preventDefault();
  const content = event.currentTarget as HTMLElement;
  const field = content.querySelector<HTMLElement>(fieldSelector);
  (field ?? content).focus();
}

export function Dialog({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  footer,
  actions,
  onCloseAutoFocus,
  children,
  placement = 'center',
  dismissible = true,
}: DialogProps) {
  const state = open === undefined ? {} : { open };
  const focus = useReturnFocus(onCloseAutoFocus);
  const locked = dismissible ? {} : { onEscapeKeyDown: stay, onInteractOutside: stay };
  return (
    <RadixDialog.Root {...state} {...(onOpenChange ? { onOpenChange } : {})}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay {...layer} className={styles.overlay} />
        <RadixDialog.Content
          {...layer}
          className={cx(styles.content, styles[placement])}
          onOpenAutoFocus={(event) => {
            focus.remember();
            focusFirstField(event);
          }}
          onCloseAutoFocus={focus.onCloseAutoFocus}
          {...locked}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <header className={styles.header}>
            <div className={styles.heading}>
              <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
              {description && <RadixDialog.Description className={styles.description}>{description}</RadixDialog.Description>}
            </div>
            <div className={styles.actions}>
              {actions}
              {dismissible && (
                <RadixDialog.Close asChild>
                  <IconButton label="Close" icon={<X aria-hidden />} />
                </RadixDialog.Close>
              )}
            </div>
          </header>
          {children && <div className={styles.body}>{children}</div>}
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export function Drawer({ side = 'right', ...props }: Omit<DialogProps, 'placement'> & { side?: 'left' | 'right' }) {
  return <Dialog {...props} placement={side} />;
}

export const DialogClose = RadixDialog.Close;
