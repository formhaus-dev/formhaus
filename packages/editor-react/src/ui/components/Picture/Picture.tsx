import { Image } from 'lucide-react';
import { useState } from 'react';
import { cx } from '../../lib/cx';
import styles from './Picture.module.css';

export function Picture({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <span className={cx(styles.empty, className)} data-picture="empty" aria-hidden>
        <Image />
      </span>
    );
  }
  return (
    <img
      className={className}
      src={src}
      alt=""
      onError={() => {
        setFailed(src);
      }}
    />
  );
}
