import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import choice from '../../styles/choice.module.css';
import styles from './RadioGroup.module.css';

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}

export type RadioGroupProps = Omit<ComponentPropsWithRef<'fieldset'>, 'onChange' | 'defaultValue'> & {
  legend: ReactNode;
  hideLegend?: boolean;
  name?: string;
  options: ChoiceOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'vertical' | 'horizontal';
};

export function RadioGroup({
  legend,
  hideLegend,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  orientation = 'vertical',
  className,
  ...rest
}: RadioGroupProps) {
  const fallback = useId();
  return (
    <fieldset className={cx(styles.group, className)} {...rest}>
      <legend className={cx(styles.legend, hideLegend && 'fh-ed-sr-only')}>{legend}</legend>
      <div className={cx(styles.options, orientation === 'horizontal' ? styles.horizontal : styles.vertical)}>
        {options.map((option) => (
          <label key={option.value} className={choice.choice}>
            <input
              type="radio"
              className={cx(choice.box, styles.radio)}
              name={name ?? fallback}
              value={option.value}
              disabled={option.disabled}
              {...(value === undefined ? { defaultChecked: option.value === defaultValue } : { checked: option.value === value })}
              onChange={() => onValueChange?.(option.value)}
            />
            <span className={choice.text}>
              {option.label}
              {option.hint && <span className={choice.hint}>{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
