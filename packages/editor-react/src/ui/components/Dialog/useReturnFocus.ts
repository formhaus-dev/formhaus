import { useRef } from 'react';

export function useReturnFocus(custom?: (event: Event) => void) {
  const opener = useRef<HTMLElement | null>(null);
  return {
    remember: () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    },
    onCloseAutoFocus: (event: Event) => {
      if (custom) {
        custom(event);
        return;
      }
      const target = opener.current;
      if (!target?.isConnected) return;
      event.preventDefault();
      target.focus();
    },
  };
}
