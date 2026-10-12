import { Plus } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import styles from './AddRow.module.css';

export type AddRowProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  label: string;
  inset?: 'card' | 'option' | 'none';
};

export function AddRow({ label, inset = 'none', className, type = 'button', ...rest }: AddRowProps) {
  return (
    <button type={type} className={cx(styles.row, styles[inset], className)} {...rest}>
      <Plus aria-hidden className={styles.icon} />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
