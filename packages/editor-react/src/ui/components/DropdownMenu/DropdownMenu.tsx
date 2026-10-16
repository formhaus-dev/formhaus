import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { AppLink } from '../AppLink/AppLink';
import styles from './DropdownMenu.module.css';

export function DropdownMenu(props: ComponentPropsWithRef<typeof Menu.Root>) {
  return <Menu.Root modal={false} {...props} />;
}

export function DropdownMenuTrigger({ children }: { children: ReactElement }) {
  return <Menu.Trigger asChild>{children}</Menu.Trigger>;
}

export type DropdownMenuContentProps = ComponentPropsWithRef<typeof Menu.Content>;

export function DropdownMenuContent({ className, align = 'end', sideOffset = 6, ...rest }: DropdownMenuContentProps) {
  return (
    <Menu.Portal>
      <Menu.Content className={cx(styles.content, className)} align={align} sideOffset={sideOffset} collisionPadding={8} {...rest} />
    </Menu.Portal>
  );
}

interface ItemLook {
  icon?: ReactNode;
  hint?: ReactNode;
  checked?: boolean;
  tone?: 'default' | 'danger';
}

function ItemBody({ icon, hint, checked, children }: ItemLook & { children: ReactNode }) {
  return (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
      {checked && <Check aria-hidden className={styles.check} />}
    </>
  );
}

export type DropdownMenuItemProps = Omit<ComponentPropsWithRef<typeof Menu.Item>, 'children'> & ItemLook & { children: ReactNode };

export function DropdownMenuItem({ icon, hint, checked, tone = 'default', className, children, ...rest }: DropdownMenuItemProps) {
  return (
    <Menu.Item className={cx(styles.item, tone === 'danger' && styles.danger, className)} aria-current={checked || undefined} {...rest}>
      <ItemBody icon={icon} hint={hint} checked={checked}>
        {children}
      </ItemBody>
    </Menu.Item>
  );
}

export type DropdownMenuLinkProps = ItemLook & { href: string; children: ReactNode };

export function DropdownMenuLink({ href, icon, hint, children }: DropdownMenuLinkProps) {
  return (
    <Menu.Item asChild className={styles.item}>
      <AppLink href={href}>
        <ItemBody icon={icon} hint={hint}>
          {children}
        </ItemBody>
      </AppLink>
    </Menu.Item>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <Menu.Label className={styles.menuLabel}>{children}</Menu.Label>;
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className={styles.separator} />;
}
