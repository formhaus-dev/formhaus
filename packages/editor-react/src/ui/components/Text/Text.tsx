import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import styles from './Text.module.css';

const text = cva(styles.text, {
  variants: {
    size: { xs: styles.xs, sm: styles.sm, md: styles.md },
    tone: {
      default: styles.default,
      muted: styles.muted,
      subtle: styles.subtle,
      danger: styles.danger,
      success: styles.success,
      accent: styles.accent,
    },
    weight: { regular: null, medium: styles.medium },
    mono: { true: styles.mono, false: null },
    truncate: { true: styles.truncate, false: null },
    numeric: { true: styles.numeric, false: null },
  },
  defaultVariants: { size: 'md', tone: 'default', weight: 'regular', mono: false, truncate: false, numeric: false },
});

export type TextProps = HTMLAttributes<HTMLElement> & VariantProps<typeof text> & { as?: 'span' | 'p' | 'code' | 'pre' | 'h2' };

export function Text({ as: Tag = 'span', size, tone, weight, mono, truncate, numeric, className, ...rest }: TextProps) {
  return <Tag className={text({ size, tone, weight, mono, truncate, numeric, className })} {...rest} />;
}
