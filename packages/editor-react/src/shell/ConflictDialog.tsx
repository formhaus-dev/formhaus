import { Button, Dialog } from '../ui';
import type { SavedDraft } from '../host';
import { useHost } from '../store/context';

interface Props {
  open: boolean;
  remote: SavedDraft | null;
  onOpenChange: (open: boolean) => void;
  onChoose: (choice: 'reload' | 'overwrite') => void;
}

export function ConflictDialog({ open, remote, onOpenChange, onChoose }: Props) {
  const host = useHost();
  if (!remote) return null;
  const who = remote.savedBy || 'Someone';
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={false}
      title="This draft was edited elsewhere"
      description={`${who} saved a newer version ${host.ago(remote.savedAt)}. Your changes since then are not saved yet.`}
      footer={
        <>
          <Button
            onClick={() => {
              onChoose('reload');
            }}
          >
            Load their version
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onChoose('overwrite');
            }}
          >
            Keep my version
          </Button>
        </>
      }
    >
      Loading their version replaces what you see now. You can undo it to get your changes back.
    </Dialog>
  );
}
