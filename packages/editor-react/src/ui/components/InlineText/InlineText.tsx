import { useCallback, useLayoutEffect, useRef, type ComponentPropsWithRef, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { cx } from '../../lib/cx';
import styles from './InlineText.module.css';

export type InlineTextProps = Omit<ComponentPropsWithRef<'textarea'>, 'value' | 'onChange' | 'rows'> & {
  value: string;
  label: string;
  onValueChange: (value: string) => void;
  onEnter?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onEscape?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  multiline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'default' | 'muted';
  rowClassName?: string;
  ring?: boolean;
  boxed?: boolean;
  suffix?: ReactNode;
};

function assign<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

function fit(node: HTMLTextAreaElement | null) {
  if (!node) return;
  node.style.height = 'auto';
  node.style.height = `${node.scrollHeight}px`;
}

export function InlineText({
  value,
  label,
  onValueChange,
  onEnter,
  onEscape,
  onKeyDown,
  multiline = false,
  size = 'md',
  tone = 'default',
  className,
  rowClassName,
  ring = false,
  boxed = false,
  suffix,
  ref,
  ...rest
}: InlineTextProps) {
  const node = useRef<HTMLTextAreaElement | null>(null);
  const attach = useCallback(
    (element: HTMLTextAreaElement | null) => {
      node.current = element;
      assign(ref, element);
    },
    [ref],
  );

  useLayoutEffect(() => {
    fit(node.current);
  }, [value]);

  function handleKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (event.key === 'Enter' && !(multiline && event.shiftKey)) {
      if (!multiline || onEnter) event.preventDefault();
      onEnter?.(event);
    } else if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape(event);
    }
  }

  return (
    <div
      className={cx(styles.row, (ring || boxed) && styles.ring, boxed && styles.boxed, rowClassName)}
      onPointerDown={(event) => {
        if (event.target !== node.current) {
          event.preventDefault();
          node.current?.focus();
        }
      }}
    >
      <textarea
        ref={attach}
        rows={1}
        aria-label={label}
        value={value}
        onChange={(event) => {
          onValueChange(multiline ? event.target.value : event.target.value.replace(/\r?\n/g, ' '));
        }}
        onKeyDown={handleKey}
        className={cx(styles.text, styles[size], tone === 'muted' && styles.muted, className)}
        {...rest}
      />
      {suffix}
    </div>
  );
}
