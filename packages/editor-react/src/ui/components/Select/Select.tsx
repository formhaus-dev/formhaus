import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import control from '../../styles/control.module.css';
import { Chevron } from '../Chevron/Chevron';
import { useFieldControl } from '../Field/context';
import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'children'> & { options: SelectOption[] };

export function Select({ className, options, ...props }: SelectProps) {
  const wired = useFieldControl(props);
  return (
    <span className={cx(styles.wrap, className)}>
      <select className={cx(control.control, styles.select)} {...wired}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <Chevron className={styles.chevron} />
    </span>
  );
}
