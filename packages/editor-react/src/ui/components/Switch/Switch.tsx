import { useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Switch.module.css';

export type SwitchProps = Omit<ComponentPropsWithRef<'button'>, 'onChange' | 'children'> & {
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({ label, checked, defaultChecked = false, onCheckedChange, className, disabled, ...rest }: SwitchProps) {
  const [own, setOwn] = useState(defaultChecked);
  const on = checked ?? own;
  const toggle = () => {
    if (checked === undefined) setOwn(!on);
    onCheckedChange?.(!on);
  };
  return (
    <label className={cx(styles.row, disabled && styles.disabled, className)}>
      <button type="button" role="switch" aria-checked={on} className={styles.track} disabled={disabled} onClick={toggle} {...rest}>
        <span className={styles.thumb} />
      </button>
      <span>{label}</span>
    </label>
  );
}
