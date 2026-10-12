import { History } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '../ui';
import type { Recovery } from '../store/recovery';
import styles from './RestoreOffer.module.css';

const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dated = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function restoreTime(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  return (at.toDateString() === now.toDateString() ? clock : dated).format(at);
}

const none = () => () => undefined;

export function RestoreOffer({ recovery }: { recovery: Recovery | null | undefined }) {
  const offer = useSyncExternalStore(recovery?.subscribe ?? none, () => recovery?.offer() ?? null);
  if (!recovery || !offer) return null;
  return (
    <div role="status" className={styles.offer}>
      <History aria-hidden className={styles.icon} />
      <p className={styles.text}>Restore unsaved changes from {restoreTime(offer.at)}?</p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={recovery.dismiss}>
          Discard
        </Button>
        <Button onClick={recovery.restore}>Restore</Button>
      </div>
    </div>
  );
}
