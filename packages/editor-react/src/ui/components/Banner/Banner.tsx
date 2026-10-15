import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Banner.module.css';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };

export type BannerProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  tone?: BannerTone;
  title?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
};

export function Banner({ tone = 'info', title, action, footer, className, children, ...rest }: BannerProps) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(styles.banner, styles[tone], footer !== undefined && styles.stacked, className)}
      {...rest}
    >
      <Icon aria-hidden className={styles.icon} />
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.text}>{children}</div>}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
