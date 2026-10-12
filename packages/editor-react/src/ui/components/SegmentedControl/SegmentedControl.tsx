import { useId, type ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import type { ChoiceOption } from '../RadioGroup/RadioGroup';
import styles from './SegmentedControl.module.css';

export type SegmentedControlProps = Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'defaultValue'> & {
  label: string;
  name?: string;
  options: ChoiceOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function SegmentedControl({ label, name, options, value, defaultValue, onValueChange, className, ...rest }: SegmentedControlProps) {
  const fallback = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.group, className)} {...rest}>
      {options.map((option) => (
        <label key={option.value} className={styles.segment}>
          <input
            type="radio"
            className={styles.input}
            name={name ?? fallback}
            value={option.value}
            disabled={option.disabled}
            {...(value === undefined ? { defaultChecked: option.value === defaultValue } : { checked: option.value === value })}
            onChange={() => onValueChange?.(option.value)}
          />
          <span className={styles.label}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
