import { checkDefinition } from '@formhaus/core';
import { Component, Suspense, useMemo, useState, type ReactNode } from 'react';
import { useReplaceDefinition } from '../json/apply';
import { FixAllButton } from '../json/JsonIssues';
import { useFixTools } from '../json/fixes';
import { useReadOnly } from '../store/hooks';
import { Banner, Button, SegmentedControl, Skeleton } from '../ui';
import { cx } from '../ui/lib/cx';
import { useHost } from '../store/context';
import { useDefinition } from '../store/hooks';
import { phone, useMedia } from '../useMedia';
import styles from './EditorPreview.module.css';

class Guard extends Component<{ children: ReactNode; reset: unknown; fallback: ReactNode }, { failed: boolean; reset: unknown }> {
  override state = { failed: false, reset: this.props.reset };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: { reset: unknown }, state: { failed: boolean; reset: unknown }) {
    return props.reset === state.reset ? null : { failed: false, reset: props.reset };
  }

  override render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function Blocked({ onShowIssues }: { onShowIssues: () => void }) {
  const definition = useDefinition();
  const tools = useFixTools();
  const readOnly = useReadOnly();
  const replace = useReplaceDefinition();
  const issues = useMemo(() => {
    const plain = JSON.parse(JSON.stringify(definition)) as typeof definition;
    return tools ? tools.suggestFixes(plain) : checkDefinition(plain);
  }, [definition, tools]);
  return (
    <Banner
      tone="warning"
      title="The preview can’t show this form yet"
      footer={
        <>
          <Button variant="primary" onClick={onShowIssues}>
            Show issues ({issues.length})
          </Button>
          <FixAllButton issues={issues} tools={readOnly ? null : tools} onApply={replace} />
        </>
      }
    >
      Fix the issues first.
    </Banner>
  );
}

export function EditorPreview({ onShowIssues }: { onShowIssues: () => void }) {
  const definition = useDefinition();
  const { Preview } = useHost();
  const [device, setDevice] = useState('desktop');
  const small = useMedia(phone);
  return (
    <div className={styles.preview}>
      {!small && (
        <SegmentedControl
          label="Preview width"
          options={[
            { value: 'desktop', label: 'Desktop' },
            { value: 'mobile', label: 'Phone' },
          ]}
          value={device}
          onValueChange={setDevice}
        />
      )}
      <div className={cx(styles.frame, device === 'mobile' && styles.mobile)}>
        <Guard reset={definition} fallback={<Blocked onShowIssues={onShowIssues} />}>
          <Suspense fallback={<Skeleton height="var(--fh-ed-size-tile)" />}>
            <Preview definition={definition} />
          </Suspense>
        </Guard>
      </div>
    </div>
  );
}
