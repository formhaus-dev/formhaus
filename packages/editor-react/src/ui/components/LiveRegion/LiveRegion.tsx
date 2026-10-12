import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnnounceContext } from './useAnnounce';

export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const frame = useRef(0);
  const announce = useCallback((next: string) => {
    cancelAnimationFrame(frame.current);
    setMessage('');
    frame.current = requestAnimationFrame(() => {
      setMessage(next);
    });
  }, []);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
    },
    [],
  );

  return (
    <AnnounceContext value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="fh-ed-sr-only" data-live-region="">
        {message}
      </div>
    </AnnounceContext>
  );
}
