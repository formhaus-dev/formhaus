import { AlertTriangle, Check, CircleAlert, CloudOff } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { formatAgo } from '../../lib/format';
import { Button } from '../Button/Button';
import { Spinner } from '../Spinner/Spinner';
import styles from './SaveStatus.module.css';

export type SaveState = 'saved' | 'saving' | 'offline' | 'error' | 'conflict';

export interface SaveStatusProps {
  status: SaveState;
  savedAt?: string | undefined;
  onRetry?: () => void;
  onResolve?: () => void;
  compact?: boolean;
  className?: string;
}

const looks: Record<SaveState, { text: string; icon: ReactNode; tone?: string }> = {
  saved: { text: 'Saved', icon: <Check aria-hidden /> },
  saving: { text: 'Saving…', icon: <Spinner size="sm" label="" /> },
  offline: { text: 'Saved on this device', icon: <CloudOff aria-hidden />, tone: 'warning' },
  error: { text: 'Couldn’t save', icon: <CircleAlert aria-hidden />, tone: 'danger' },
  conflict: { text: 'Edited elsewhere', icon: <AlertTriangle aria-hidden />, tone: 'warning' },
};

function useNow(active: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => {
      clearInterval(timer);
    };
  }, [active]);
  return now;
}

export function SaveStatus({ status, savedAt, onRetry, onResolve, compact = false, className }: SaveStatusProps) {
  const look = looks[status];
  const now = useNow(status === 'saved' && !!savedAt);
  const when = status === 'saved' && savedAt ? formatAgo(savedAt, now) : '';
  return (
    <div className={cx(styles.root, look.tone && styles[look.tone], className)}>
      <span className={styles.state}>
        <span className={styles.icon}>{look.icon}</span>
        <span className={compact ? 'fh-ed-sr-only' : styles.text}>
          {look.text}
          {when && <span className={styles.when}> · {when}</span>}
        </span>
      </span>
      <span role="status" className="fh-ed-sr-only">
        {look.tone ? look.text : ''}
      </span>
      {status === 'error' && onRetry && (
        <Button variant="ghost" className={styles.action} onClick={onRetry}>
          Retry
        </Button>
      )}
      {status === 'conflict' && onResolve && (
        <Button variant="ghost" className={styles.action} onClick={onResolve}>
          Review
        </Button>
      )}
    </div>
  );
}
