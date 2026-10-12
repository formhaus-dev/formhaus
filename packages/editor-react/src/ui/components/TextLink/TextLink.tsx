import { ExternalLink } from 'lucide-react';
import { cx } from '../../lib/cx';
import { AppLink, type AppLinkProps } from '../AppLink/AppLink';
import styles from './TextLink.module.css';

export type TextLinkProps = AppLinkProps & { external?: boolean; muted?: boolean };

export function TextLink({ external = false, muted = false, className, children, ...rest }: TextLinkProps) {
  const target = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <AppLink className={cx(styles.link, muted && styles.muted, className)} {...target} {...rest}>
      {children}
      {external && <ExternalLink aria-hidden className={styles.icon} />}
      {external && <span className="fh-ed-sr-only"> (opens in a new tab)</span>}
    </AppLink>
  );
}
