import { Ellipsis, Keyboard, Redo2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  IconButton,
  Tooltip,
} from '../ui';
import type { Published } from '../host';
import { useEditorHandle } from '../store/context';
import { useDirty } from '../store/dirty';
import { useCanRedo, useReadOnly } from '../store/hooks';
import styles from './Publish.module.css';
import { PublishButton } from './PublishButton';
import { usePublish } from './usePublish';

interface ActionProps {
  published: Published | null;
  compact: boolean;
}

export function PublishAction({ published, compact }: ActionProps) {
  const readOnly = useReadOnly();
  const changed = useDirty();
  const state = usePublish();
  const { host } = useEditorHandle();
  if (readOnly || !host.publish) return null;
  const next = published ? `Publishing creates v${String(published.version + 1)}.` : 'Publishing creates the form and its link.';
  return (
    <>
      {published && !compact && (
        <Tooltip content={`Responses keep the version they were submitted with. ${next}`}>
          <span className={styles.live} tabIndex={0}>
            v{published.version} · live
          </span>
        </Tooltip>
      )}
      <PublishButton
        label="Publish"
        hint={next}
        idleHint={published ? `Nothing to publish. v${String(published.version)} is live.` : 'Nothing to publish yet'}
        disabled={!!published && !changed}
        compact={compact}
        state={state}
      />
    </>
  );
}

interface MenuProps {
  published: Published | null;
  compact: boolean;
  onHelp: () => void;
}

export function EditorMenu({ published, compact, onHelp }: MenuProps) {
  const { autosave, host, store } = useEditorHandle();
  const canRedo = useCanRedo();
  const readOnly = useReadOnly();
  const changed = useDirty();
  const [discard, setDiscard] = useState(false);
  const removable = published ? changed : host.isNew && host.stored();
  if (readOnly) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <IconButton label="More editor actions" icon={<Ellipsis aria-hidden />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {compact && published && <DropdownMenuLabel>v{published.version} · live</DropdownMenuLabel>}
          {compact && (
            <DropdownMenuItem icon={<Redo2 aria-hidden />} disabled={!canRedo} onSelect={store.redo}>
              Redo
            </DropdownMenuItem>
          )}
          <DropdownMenuItem icon={<Keyboard aria-hidden />} hint="?" onSelect={onHelp}>
            Keyboard shortcuts
          </DropdownMenuItem>
          {removable && (
            <DropdownMenuItem
              tone="danger"
              icon={<Trash2 aria-hidden />}
              onSelect={() => {
                setDiscard(true);
              }}
            >
              {published ? 'Discard unpublished changes' : 'Delete draft'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={discard}
        onOpenChange={setDiscard}
        tone="danger"
        title={published ? 'Discard unpublished changes?' : 'Delete this draft?'}
        description={
          published
            ? `The editor goes back to version ${String(published.version)}. This also removes the draft for everyone in the workspace.`
            : 'The draft is removed for everyone in the workspace. Nothing was published.'
        }
        confirmLabel={published ? 'Discard changes' : 'Delete draft'}
        onConfirm={async () => {
          autosave?.stop();
          try {
            await host.discard();
            host.onDiscarded?.();
          } catch (error) {
            autosave?.start();
            host.notify({ title: 'Could not discard the draft', description: host.describeError(error), tone: 'danger' });
          }
        }}
      />
    </>
  );
}
