import { ChevronDown } from 'lucide-react';
import { cx } from '../../lib/cx';
import styles from './Chevron.module.css';

export function Chevron({ className }: { className?: string }) {
  return <ChevronDown aria-hidden className={cx(styles.chevron, className)} />;
}
