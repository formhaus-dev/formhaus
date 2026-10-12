import { Banner, Skeleton, Stack } from '../ui';
import type { EditorHost, Published } from '../host';
import type { InitialEditor } from '../store/initial';
import { useEditorSession } from '../store/session';
import { useEditorSource } from '../store/source';
import { EditorView, type EditorMode } from './EditorView';
import styles from './EditorShell.module.css';

interface Props {
  host: EditorHost;
  mode?: EditorMode;
}

export function EditorScreen({ host, mode }: Props) {
  const source = useEditorSource(host);
  if (source.status === 'error') {
    return (
      <div className={styles.layout}>
        <Banner tone="danger" title="Could not open the editor" className={styles.notice}>
          {host.describeError(source.error)}
        </Banner>
      </div>
    );
  }
  if (source.status === 'loading') {
    return (
      <div className={styles.layout} aria-busy="true" aria-label="Loading editor">
        <Stack gap="3" className={styles.notice}>
          <Skeleton height="var(--fh-ed-size-row)" />
          <Skeleton height="var(--fh-ed-size-tile)" />
          <Skeleton height="var(--fh-ed-size-tile)" />
        </Stack>
      </div>
    );
  }
  return <Session host={host} initial={source.initial} published={source.published} {...(mode ? { mode } : {})} />;
}

function Session({ host, initial, published, mode }: Props & { initial: InitialEditor; published: Published | null }) {
  const handle = useEditorSession({ host, initial, published });
  return <EditorView handle={handle} stale={initial.stale} {...(mode ? { mode } : {})} />;
}
