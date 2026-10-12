import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import styles from './Skeleton.module.css';

export type SkeletonProps = ComponentPropsWithRef<'span'> & { width?: number | string; height?: number | string };

export function Skeleton({ width, height, className, style, ...rest }: SkeletonProps) {
  return <span aria-hidden className={cx(styles.skeleton, className)} style={{ width, height, ...style }} {...rest} />;
}
