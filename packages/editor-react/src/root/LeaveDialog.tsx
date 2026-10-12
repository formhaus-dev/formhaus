import { useEffect, useRef, useState } from 'react';
import { leaveMessage, setLeavePrompt } from '../store/leave';
import { ConfirmDialog } from '../ui';

export function LeaveDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const answer = useRef<((leave: boolean) => void) | null>(null);
  useEffect(
    () =>
      setLeavePrompt(
        () =>
          new Promise<boolean>((resolve) => {
            answer.current?.(false);
            answer.current = resolve;
            setMessage(leaveMessage());
            setOpen(true);
          }),
      ),
    [],
  );
  const close = (leave: boolean) => {
    answer.current?.(leave);
    answer.current = null;
    setOpen(false);
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close(false);
      }}
      title="Leave without saving?"
      description={message}
      confirmLabel="Leave"
      onConfirm={() => {
        close(true);
        return undefined;
      }}
    />
  );
}
