import { Braces, Eye, PenLine, type LucideIcon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Banner, SegmentedControl } from '../ui';
import { JsonPane } from '../json/JsonPane';
import { EditorPreview } from '../preview/EditorPreview';
import { EditorMenu, PublishAction } from '../publish/PublishControls';
import type { EditorHandle } from '../store/context';
import { phone, useMedia, wide } from '../useMedia';
import { EditorShell } from './EditorShell';
import styles from './EditorShell.module.css';
import { EditorTopBar } from './EditorTopBar';
import { ShortcutsDialog } from './ShortcutsDialog';
import { RestoreOffer } from './RestoreOffer';
import { useEditorKeys } from './useEditorKeys';
import { useTabScroll } from './useTabScroll';
import { Workspace } from './Workspace';

export type EditorMode = 'edit' | 'json' | 'preview';

const MODES: [EditorMode, string, LucideIcon][] = [
  ['edit', 'Visual', PenLine],
  ['json', 'JSON', Braces],
  ['preview', 'Preview', Eye],
];

const modeOptions = (small: boolean, docked: boolean) =>
  MODES.filter(([value]) => !docked || value !== 'preview').map(([value, label, Icon]) => ({
    value,
    label: small ? (
      <>
        <Icon aria-hidden />
        <span className="fh-ed-sr-only">{label}</span>
      </>
    ) : (
      label
    ),
  }));

interface Props {
  handle: EditorHandle;
  stale: boolean;
  mode?: EditorMode;
  compact?: boolean;
  split?: boolean;
}

export function EditorView({ handle, stale, mode: initialMode = 'edit', compact = false, split = false }: Props) {
  const { published } = handle;
  const [picked, setShownMode] = useState<string>(initialMode);
  const docked = useMedia(wide) && split && !compact;
  const mode = docked && picked === 'preview' ? 'edit' : picked;
  const top = useRef<HTMLDivElement>(null);
  const remember = useTabScroll(mode, top, docked);
  const setMode = useCallback(
    (next: string, restore = true) => {
      remember(restore);
      setShownMode(next);
    },
    [remember],
  );
  const small = useMedia(phone);
  const [help, setHelp] = useState(false);
  const [reveal, setReveal] = useState(false);
  const onShowIssues = useCallback(() => {
    setMode('json', false);
    setReveal(true);
  }, [setMode]);
  const onRevealed = useCallback(() => {
    setReveal(false);
  }, []);
  const onToggleJson = useCallback(() => {
    if (!compact) setMode(mode === 'json' ? 'edit' : 'json');
  }, [compact, mode, setMode]);
  const onHelp = useCallback(() => {
    setHelp(true);
  }, []);
  useEditorKeys({ onToggleJson, onHelp });
  const modes = (
    <SegmentedControl label="Editor mode" options={modeOptions(small, docked)} value={mode} onValueChange={(next) => setMode(next)} />
  );
  const publish = <PublishAction published={published} compact={small} />;
  const editor = (
    <>
      <div ref={top} />
      {!compact && (
        <EditorTopBar
          compact={small}
          start={modes}
          end={
            <>
              {publish}
              <EditorMenu published={published} compact={small} onHelp={onHelp} />
            </>
          }
        />
      )}
      <RestoreOffer recovery={handle.recovery} />
      {stale && published && (
        <div className={styles.layout}>
          <Banner
            tone="warning"
            className={styles.notice}
            title={`Version ${String(published.version)} was published after this draft started`}
          >
            Publishing replaces it with this draft. Discard the draft to start from version {published.version}.
          </Banner>
        </div>
      )}
      {mode === 'preview' && (
        <div className={styles.layout}>
          <EditorPreview onShowIssues={onShowIssues} />
        </div>
      )}
      {mode === 'json' && (
        <div className={styles.layout}>
          <JsonPane reveal={reveal} onRevealed={onRevealed} />
        </div>
      )}
      <div hidden={mode !== 'edit'}>
        <Workspace outline={!compact} header={!compact} />
      </div>
    </>
  );
  return (
    <EditorShell handle={handle} docked={docked}>
      <div className={styles.split} data-docked={docked || undefined}>
        <div className={styles.main} data-scroll={docked || undefined}>
          {editor}
        </div>
        {docked && (
          <aside className={styles.docked} aria-label="Live preview">
            <EditorPreview docked onShowIssues={onShowIssues} />
          </aside>
        )}
      </div>
      <ShortcutsDialog open={help} onOpenChange={setHelp} />
    </EditorShell>
  );
}
