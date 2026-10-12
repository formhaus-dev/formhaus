import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { FieldContext } from './context';
import styles from './Field.module.css';

export type FieldProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hideLabel?: boolean;
  children: ReactNode;
};

export function Field({ label, hint, error, required = false, hideLabel = false, className, children, ...rest }: FieldProps) {
  const id = useId();
  const hintID = hint ? `${id}-hint` : undefined;
  const errorID = error ? `${id}-error` : undefined;
  const describedBy = [hintID, errorID].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx(styles.field, className)} {...rest}>
      <label htmlFor={id} className={cx(styles.label, hideLabel && 'fh-ed-sr-only')}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden>
            *
          </span>
        )}
      </label>
      <FieldContext value={{ id, describedBy, invalid: Boolean(error), required }}>{children}</FieldContext>
      {hint && (
        <p id={hintID} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorID} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
