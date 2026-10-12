import { useEffect } from 'react';

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

export function useEditorKeys({ onToggleJson, onHelp }: { onToggleJson: () => void; onHelp: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key === '\\') {
        event.preventDefault();
        onToggleJson();
      } else if ((mod && event.key === '/') || (event.key === '?' && !mod && !typing(event.target))) {
        event.preventDefault();
        onHelp();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onToggleJson, onHelp]);
}
