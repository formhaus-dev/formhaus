import { Braces, Eye, PenLine, type LucideIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Banner, SegmentedControl } from '../ui';
import { JsonPane } from '../json/JsonPane';
import { EditorPreview } from '../preview/EditorPreview';
import { EditorMenu, PublishAction } from '../publish/PublishControls';
import type { EditorHandle } from '../store/context';
import { phone, useMedia } from '../useMedia';
import { EditorShell } from './EditorShell';
import styles from './EditorShell.module.css';
import { EditorTopBar } from './EditorTopBar';
import { ShortcutsDialog } from './ShortcutsDialog';
import { useEditorKeys } from './useEditorKeys';
import { Workspace } from './Workspace';

export type EditorMode = 'edit' | 'json' | 'preview';

const MODES: [EditorMode, string, LucideIcon][] = [
  ['edit', 'Visual', PenLine],
  ['json', 'JSON', Braces],
  ['preview', 'Preview', Eye],
];

const modeOptions = (small: boolean) =>
  MODES.map(([value, label, Icon]) => ({
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
}

export function EditorView({ handle, stale, mode: initialMode = 'edit' }: Props) {
  const { published } = handle;
  const [mode, setMode] = useState<string>(initialMode);
  const small = useMedia(phone);
  const [help, setHelp] = useState(false);
  const onToggleJson = useCallback(() => {
    setMode((current) => (current === 'json' ? 'edit' : 'json'));
  }, []);
  const onHelp = useCallback(() => {
    setHelp(true);
  }, []);
  useEditorKeys({ onToggleJson, onHelp });
  const modes = <SegmentedControl label="Editor mode" options={modeOptions(small)} value={mode} onValueChange={setMode} />;
  const publish = <PublishAction published={published} compact={small} />;
  return (
    <EditorShell handle={handle}>
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
          <EditorPreview />
        </div>
      )}
      {mode === 'json' && (
        <div className={styles.layout}>
          <JsonPane />
        </div>
      )}
      <div hidden={mode !== 'edit'}>
        <Workspace />
      </div>
      <ShortcutsDialog open={help} onOpenChange={setHelp} />
    </EditorShell>
  );
}
