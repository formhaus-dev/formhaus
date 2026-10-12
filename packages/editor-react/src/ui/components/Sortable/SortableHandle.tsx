import { GripHorizontal } from 'lucide-react';
import { cx } from '../../lib/cx';
import styles from './Sortable.module.css';
import type { SortableHandleProps } from './SortableRow';

export function SortableHandle({ className, ...props }: SortableHandleProps & { className?: string }) {
  return (
    <button type="button" className={cx(styles.handle, className)} {...props}>
      <GripHorizontal aria-hidden />
    </button>
  );
}
