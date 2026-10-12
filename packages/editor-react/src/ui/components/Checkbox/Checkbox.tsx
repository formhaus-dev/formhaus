import { Check } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import choice from '../../styles/choice.module.css';
import styles from './Checkbox.module.css';

export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type'> & { label: ReactNode; hint?: ReactNode };

export function Checkbox({ label, hint, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx(choice.choice, className)}>
      <span className={styles.wrap}>
        <input type="checkbox" className={cx(choice.box, styles.box)} {...rest} />
        <Check aria-hidden className={styles.mark} />
      </span>
      <span className={choice.text}>
        {label}
        {hint && <span className={choice.hint}>{hint}</span>}
      </span>
    </label>
  );
}
