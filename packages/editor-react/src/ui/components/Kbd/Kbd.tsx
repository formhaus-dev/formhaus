import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import styles from './Kbd.module.css';

export type KbdProps = ComponentPropsWithRef<'kbd'>;

export function Kbd({ className, ...rest }: KbdProps) {
  return <kbd className={cx(styles.kbd, className)} {...rest} />;
}
