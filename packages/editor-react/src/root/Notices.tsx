import { X } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import type { Notice } from '../host';
import { Button, IconButton } from '../ui';
import styles from './Notices.module.css';

interface Entry extends Notice {
  id: number;
}

const LIFETIME = 6000;

export function useNotices() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const dismiss = useCallback((id: number) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);
  const notify = useCallback(
    (notice: Notice) => {
      const id = Date.now() + Math.random();
      setEntries((current) => [...current.slice(-2), { ...notice, id }]);
      setTimeout(() => {
        dismiss(id);
      }, LIFETIME);
    },
    [dismiss],
  );
  return { entries, notify, dismiss };
}

export function Notices({ entries, dismiss }: { entries: Entry[]; dismiss: (id: number) => void }): ReactNode {
  return (
    <div role="status" aria-live="polite">
      <ol className={styles.stack}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.notice} data-tone={entry.tone ?? 'neutral'}>
            <div className={styles.text}>
              <span className={styles.title}>{entry.title}</span>
              {entry.description && <span className={styles.description}>{entry.description}</span>}
            </div>
            {entry.action && (
              <Button
                variant="ghost"
                onClick={() => {
                  entry.action?.onClick();
                  dismiss(entry.id);
                }}
              >
                {entry.action.label}
              </Button>
            )}
            <IconButton
              label="Dismiss"
              icon={<X aria-hidden />}
              onClick={() => {
                dismiss(entry.id);
              }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
