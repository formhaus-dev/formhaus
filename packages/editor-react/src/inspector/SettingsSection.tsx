import type { ReactNode } from 'react';
import { cx, Text } from '../ui';
import styles from './Inspector.module.css';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.block} aria-label={title}>
      <Text className={cx(styles.wide, styles.heading)}>{title}</Text>
      {children}
    </section>
  );
}
