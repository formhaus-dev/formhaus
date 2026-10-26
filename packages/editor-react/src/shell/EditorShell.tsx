import { isUndoKey } from '@formhaus/builder';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LiveRegionProvider } from '../ui';
import { RemovalGuardProvider } from '../logic/RemovalGuard';
import { createFocusRequests, FocusContext } from '../canvas/focus';
import { EditorContext, type EditorHandle } from '../store/context';
import styles from './EditorShell.module.css';

export function EditorShell({ handle, docked = false, children }: { handle: EditorHandle; docked?: boolean; children: ReactNode }) {
  const [focus] = useState(createFocusRequests);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { onTitle } = handle.host;
    if (!onTitle) return undefined;
    const sync = () => {
      onTitle(handle.store.getState().form.title);
    };
    sync();
    const stop = handle.store.subscribe(sync);
    return () => {
      stop();
      onTitle(null);
    };
  }, [handle]);

  useEffect(() => {
    const root = document.documentElement;
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key.startsWith('Arrow')) root.dataset.input = 'keyboard';
    };
    const pointer = () => {
      root.dataset.input = 'pointer';
    };
    window.addEventListener('keydown', keyboard, true);
    window.addEventListener('pointerdown', pointer, true);
    return () => {
      window.removeEventListener('keydown', keyboard, true);
      window.removeEventListener('pointerdown', pointer, true);
      delete root.dataset.input;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = isUndoKey(event);
      const inside = event.target === document.body || (event.target instanceof Node && !!root.current?.contains(event.target));
      if (!action || !inside || event.defaultPrevented || handle.store.getState().readOnly) return;
      event.preventDefault();
      if (action === 'undo') handle.store.undo();
      else handle.store.redo();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [handle]);

  return (
    <EditorContext value={handle}>
      <FocusContext value={focus}>
        <LiveRegionProvider>
          <RemovalGuardProvider>
            <div ref={root} className={styles.shell} data-route={handle.host.isNew ? 'new' : 'form'} data-docked={docked || undefined}>
              {children}
            </div>
          </RemovalGuardProvider>
        </LiveRegionProvider>
      </FocusContext>
    </EditorContext>
  );
}
