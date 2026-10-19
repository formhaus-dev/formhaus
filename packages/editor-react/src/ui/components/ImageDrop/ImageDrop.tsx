import { ImagePlus } from 'lucide-react';
import { useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { Picture } from '../Picture/Picture';
import { Spinner } from '../Spinner/Spinner';
import styles from './ImageDrop.module.css';

export interface ImageDropProps {
  src: string;
  label: string;
  accept?: readonly string[];
  busy?: boolean;
  disabled?: boolean;
  onFile?: (file: File) => void;
  onText?: (text: string) => void;
  upload?: { text: string; label: string };
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

function firstFile(data: DataTransfer | null): File | null {
  if (!data) return null;
  const files = Array.from(data.files);
  return files.find((file) => file.type.startsWith('image/')) ?? files[0] ?? null;
}

export function ImageDrop({
  src,
  label,
  accept = [],
  busy = false,
  disabled = false,
  onFile,
  onText,
  upload,
  actions,
  footer,
  className,
  children,
}: ImageDropProps) {
  const picker = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const takesFiles = !!onFile && !disabled && !busy;
  const pick = () => {
    picker.current?.click();
  };

  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (disabled || busy) return;
    const file = onFile ? firstFile(event.clipboardData) : null;
    if (file && onFile) {
      event.preventDefault();
      onFile(file);
      return;
    }
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const text = event.clipboardData.getData('text').trim();
    if (!text || !onText) return;
    event.preventDefault();
    onText(text);
  };

  const drop = takesFiles
    ? {
        onDragOver: (event: DragEvent<HTMLDivElement>) => {
          if (!Array.from(event.dataTransfer.types).includes('Files')) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setOver(true);
        },
        onDragLeave: (event: DragEvent<HTMLDivElement>) => {
          if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
          setOver(false);
        },
        onDrop: (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setOver(false);
          const file = firstFile(event.dataTransfer);
          if (file) onFile(file);
        },
      }
    : {};

  let well: ReactNode;
  if (busy) {
    well = (
      <span className={styles.well}>
        <Spinner size="sm" label="" />
      </span>
    );
  } else if (src) {
    well = <Picture className={styles.well} src={src} />;
  } else {
    well = (
      <span className={cx(styles.well, styles.empty, takesFiles && styles.pick)} aria-hidden onClick={takesFiles ? pick : undefined}>
        <ImagePlus />
      </span>
    );
  }

  const button = takesFiles && upload && (
    <Button aria-label={upload.label} onClick={pick}>
      {upload.text}
    </Button>
  );

  return (
    <div
      className={cx(styles.root, className)}
      role="group"
      aria-label={label}
      aria-busy={busy || undefined}
      data-drop={over || undefined}
      onPaste={onPaste}
      {...drop}
    >
      <div className={styles.line}>
        {well}
        <div className={styles.body}>{children}</div>
        {(button || actions) && (
          <div className={styles.actions}>
            {button}
            {actions}
          </div>
        )}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
      {onFile && !disabled && (
        <input
          ref={picker}
          type="file"
          hidden
          tabIndex={-1}
          accept={accept.join(',')}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onFile(file);
          }}
        />
      )}
    </div>
  );
}
