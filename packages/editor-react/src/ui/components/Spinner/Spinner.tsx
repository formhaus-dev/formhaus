import { cva } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import styles from './Spinner.module.css';

const spinner = cva(styles.spinner, {
  variants: { size: { sm: styles.sm, md: styles.md, lg: styles.lg } },
  defaultVariants: { size: 'md' },
});

export type SpinnerProps = ComponentPropsWithRef<'span'> & { size?: 'sm' | 'md' | 'lg'; label?: string };

export function Spinner({ size, label = 'Loading', className, ...rest }: SpinnerProps) {
  const labelled = label !== '';
  return (
    <span
      className={spinner({ size, className })}
      role={labelled ? 'status' : undefined}
      aria-label={labelled ? label : undefined}
      aria-hidden={labelled ? undefined : true}
      {...rest}
    />
  );
}
