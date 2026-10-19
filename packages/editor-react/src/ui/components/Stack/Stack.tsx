import type { ComponentPropsWithRef, CSSProperties } from 'react';
import { cx } from '../../lib/cx';
import styles from './Stack.module.css';

type Space = '0' | '0-5' | '1' | '1-5' | '2' | '2-5' | '3' | '4' | '5' | '6' | '8' | '10' | '12';

type Align = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type Justify = 'start' | 'center' | 'end' | 'between';

interface LayoutProps {
  gap?: Space;
  align?: Align;
  justify?: Justify;
}

function layoutStyle({ gap, align, justify }: LayoutProps, style: CSSProperties | undefined): CSSProperties {
  const custom: Record<string, string> = {};
  if (gap) custom['--layout-gap'] = gap === '0' ? '0' : `var(--fh-ed-space-${gap})`;
  if (align) custom['--layout-align'] = align === 'start' || align === 'end' ? `flex-${align}` : align;
  if (justify) custom['--layout-justify'] = justify === 'between' ? 'space-between' : justify === 'center' ? 'center' : `flex-${justify}`;
  return { ...custom, ...style };
}

export type StackProps = ComponentPropsWithRef<'div'> & LayoutProps & { grow?: boolean; stackBelow?: 'md' };

export function Stack({ gap = '2', align, justify, grow = false, stackBelow, className, style, ...rest }: StackProps) {
  return (
    <div
      className={cx(styles.stack, grow && styles.grow, stackBelow && styles.stackMd, className)}
      style={layoutStyle({ gap, align, justify }, style)}
      {...rest}
    />
  );
}

export type InlineProps = StackProps & { wrap?: boolean };

export function Inline({
  gap = '2',
  align = 'center',
  justify,
  wrap = true,
  grow = false,
  stackBelow,
  className,
  style,
  ...rest
}: InlineProps) {
  return (
    <div
      className={cx(styles.inline, !wrap && styles.nowrap, grow && styles.grow, stackBelow && styles.stackMd, className)}
      style={layoutStyle({ gap, align, justify }, style)}
      {...rest}
    />
  );
}

export type GridProps = ComponentPropsWithRef<'div'> & { gap?: Space; min?: string };

export function Grid({ gap = '4', min = 'var(--fh-ed-size-menu)', className, style, ...rest }: GridProps) {
  return (
    <div
      className={cx(styles.grid, className)}
      style={{ ...layoutStyle({ gap }, undefined), '--grid-min': min, ...style } as CSSProperties}
      {...rest}
    />
  );
}
