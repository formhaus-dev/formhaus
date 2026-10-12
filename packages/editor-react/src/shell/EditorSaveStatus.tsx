import { useEffect, useRef, useState } from 'react';
import { SaveStatus, Tooltip, useAnnounce, type SaveState } from '../ui';
import { useEditorHandle } from '../store/context';
import { useSave } from '../store/hooks';
import type { SaveStatus as Status } from '../store/store';
import { ConflictDialog } from './ConflictDialog';

const shown: Record<Status, SaveState | null> = {
  idle: null,
  pending: 'saving',
  saving: 'saving',
  saved: 'saved',
  error: 'error',
  conflict: 'conflict',
};

export function EditorSaveStatus({ compact = false }: { compact?: boolean }) {
  const save = useSave();
  const { autosave, host } = useEditorHandle();
  const [review, setReview] = useState(false);
  const announce = useAnnounce();
  const troubled = useRef(false);
  useEffect(() => {
    if (save.status === 'error' && !troubled.current) announce('Couldn’t save');
    if (save.status === 'error' || save.status === 'conflict') troubled.current = true;
    if (save.status === 'saved' && troubled.current) {
      troubled.current = false;
      announce('Saved');
    }
  }, [save.status, announce]);
  const status = compact && save.status !== 'error' && save.status !== 'conflict' ? null : shown[save.status];
  return (
    <>
      {status === 'saved' && host.savedHint ? (
        <Tooltip content={host.savedHint}>
          <span tabIndex={0}>
            <SaveStatus status={status} />
          </span>
        </Tooltip>
      ) : (
        status && (
          <SaveStatus
            status={status}
            onRetry={() => void autosave?.flush()}
            onResolve={() => {
              setReview(true);
            }}
          />
        )
      )}
      <ConflictDialog
        open={review || save.status === 'conflict'}
        remote={save.conflict}
        onOpenChange={setReview}
        onChoose={(choice) => {
          setReview(false);
          void autosave?.resolve(choice);
        }}
      />
    </>
  );
}
