import type { RefObject } from 'react';
import { Input } from '../ui';
import { LINK_ERROR, isEmbedded } from './imageSource';
import styles from './OptionImage.module.css';

interface Props {
  name: string;
  value: string;
  errorId: string | undefined;
  autoFocus: boolean;
  root: RefObject<HTMLDivElement | null>;
  onChange: (value: string) => void;
  onError: (message: string) => void;
  onCommit: () => void;
  onCancel: (() => void) | undefined;
}

export function ImageLink({ name, value, errorId, autoFocus, root, onChange, onError, onCommit, onCancel }: Props) {
  return (
    <Input
      type="url"
      inputMode="url"
      className={styles.link}
      aria-label={`Image link for ${name}`}
      aria-invalid={errorId ? true : undefined}
      aria-describedby={errorId}
      placeholder="https://…"
      autoFocus={autoFocus}
      value={value}
      onChange={(event) => {
        if (isEmbedded(event.target.value)) onError(LINK_ERROR);
        else onChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onCommit();
        } else if (event.key === 'Escape' && onCancel) {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && root.current?.contains(event.relatedTarget)) return;
        onCommit();
      }}
    />
  );
}
