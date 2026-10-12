import { cva, type VariantProps } from 'class-variance-authority';
import styles from './Button.module.css';

export const buttonVariants = cva(styles.button, {
  variants: {
    variant: {
      primary: styles.primary,
      secondary: styles.secondary,
      ghost: styles.ghost,
      danger: styles.danger,
      'danger-outline': styles.dangerOutline,
    },
    size: { md: styles.md, lg: styles.lg },
    iconOnly: { true: styles.iconOnly, false: null },
    block: { true: styles.block, false: null },
    align: { center: null, start: styles.start },
    collapse: { md: styles.collapseMd, never: null },
  },
  defaultVariants: { variant: 'secondary', size: 'md', iconOnly: false, block: false, align: 'center', collapse: 'never' },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;
