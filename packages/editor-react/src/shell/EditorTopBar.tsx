import { Redo2, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { IconButton } from '../ui';
import { useEditorStore } from '../store/context';
import { useCanRedo, useCanUndo, useReadOnly } from '../store/hooks';
import { EditorSaveStatus } from './EditorSaveStatus';
import styles from './EditorShell.module.css';
import { redoHint, undoHint } from './keys';
import { scrollRoot, scrollTop } from './scroller';

const focusable = 'button:not([disabled]), input:checked:not([disabled]), [tabindex="0"]';

function HistoryButton({ onOrphan, ...props }: ComponentProps<typeof IconButton> & { onOrphan: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(
    () => () => {
      if (ref.current && ref.current === document.activeElement) onOrphan();
    },
    [onOrphan],
  );
  return <IconButton ref={ref} {...props} />;
}

function UndoRedo({ compact }: { compact: boolean }) {
  const store = useEditorStore();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo() && !compact;
  const group = useRef<HTMLSpanElement>(null);
  const orphaned = useRef(false);
  const onOrphan = useCallback(() => {
    orphaned.current = true;
  }, []);
  useLayoutEffect(() => {
    if (!orphaned.current) return;
    orphaned.current = false;
    const start = group.current?.parentElement;
    const next = group.current?.querySelector<HTMLElement>(focusable) ?? start?.querySelector<HTMLElement>(focusable);
    next?.focus();
  }, [canUndo, canRedo]);
  return (
    <span ref={group} className={styles.history}>
      {canUndo && (
        <HistoryButton
          label="Undo"
          shortcut={undoHint()}
          aria-keyshortcuts="Meta+Z Control+Z"
          icon={<Undo2 aria-hidden />}
          onClick={store.undo}
          onOrphan={onOrphan}
        />
      )}
      {canRedo && (
        <HistoryButton
          label="Redo"
          shortcut={redoHint()}
          aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
          icon={<Redo2 aria-hidden />}
          onClick={store.redo}
          onOrphan={onOrphan}
        />
      )}
    </span>
  );
}

export function EditorTopBar({ start, end, compact = false }: { start?: ReactNode; end?: ReactNode; compact?: boolean }) {
  const readOnly = useReadOnly();
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = bar.current;
    if (!node) return undefined;
    const update = () => {
      const root = scrollRoot(node);
      const top = Number.parseFloat(getComputedStyle(node).top) + (root?.getBoundingClientRect().top ?? 0);
      node.toggleAttribute('data-stuck', node.getBoundingClientRect().top <= top + 1 && scrollTop(root) > 0);
    };
    update();
    document.addEventListener('scroll', update, { capture: true, passive: true });
    return () => {
      document.removeEventListener('scroll', update, { capture: true });
    };
  }, []);
  return (
    <div ref={bar} className={styles.topBar} data-topbar>
      <div className={styles.topStart}>
        {start}
        {!readOnly && <UndoRedo compact={compact} />}
      </div>
      <div className={styles.topEnd}>
        {readOnly ? (
          <span className={styles.readOnly}>View only</span>
        ) : (
          <span className={compact ? styles.statusCompact : styles.status}>
            <EditorSaveStatus compact={compact} />
          </span>
        )}
        {end}
      </div>
    </div>
  );
}
