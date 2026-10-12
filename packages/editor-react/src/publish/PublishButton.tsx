import { Button, ConfirmDialog, Popover } from '../ui';
import { cx } from '../ui/lib/cx';
import styles from './Publish.module.css';
import { useEditorStore } from '../store/context';
import { focusCard } from '../canvas/focus';
import { IssueList } from './IssueList';
import type { usePublish } from './usePublish';

interface Props {
  label: string;
  hint: string;
  idleHint: string;
  disabled: boolean;
  compact: boolean;
  state: ReturnType<typeof usePublish>;
}

export function PublishButton({ label, hint, idleHint, disabled, state }: Props) {
  const store = useEditorStore();
  const blocking = state.problems.filter((problem) => problem.severity === 'error').length;
  const button = (
    <Button
      variant="primary"
      title={disabled ? idleHint : hint}
      aria-disabled={disabled || undefined}
      className={cx(disabled && styles.idle)}
      loading={state.pending}
      onClick={() => {
        if (!disabled) void state.publish();
      }}
    >
      {label}
    </Button>
  );
  return (
    <>
      <Popover
        open={state.problems.length > 0}
        onOpenChange={(open) => {
          if (!open) state.dismiss();
        }}
        anchor={<span>{button}</span>}
        align="end"
        width="wide"
        label={blocking ? `Fix ${String(blocking)} ${blocking === 1 ? 'issue' : 'issues'} before publishing` : 'Check before publishing'}
      >
        <IssueList
          problems={state.problems}
          onJump={(uid) => {
            state.dismiss();
            const kind = store.getState().form.blocks.find((block) => block.uid === uid)?.kind === 'page' ? 'step' : 'field';
            store.select({ kind, uid });
            requestAnimationFrame(() => {
              focusCard(uid, 'label');
            });
          }}
          onPublishAnyway={
            blocking
              ? undefined
              : () => {
                  void state.publish({ force: true });
                }
          }
        />
      </Popover>
      <ConfirmDialog
        open={state.stale !== null}
        onOpenChange={(open) => {
          if (!open) state.cancelStale();
        }}
        title="A newer version was published"
        description={`Version ${String(state.stale ?? '')} was published after this draft started. Publishing now replaces it with this draft.`}
        confirmLabel="Publish this draft"
        onConfirm={() => state.publish({ overwrite: true, force: true })}
      />
    </>
  );
}
