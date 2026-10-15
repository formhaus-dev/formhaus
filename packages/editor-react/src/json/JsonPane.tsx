import { SCHEMA_URL } from '@formhaus/builder';
import { checkDefinition } from '@formhaus/core';
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef } from 'react';
import { Spinner, Text, TextLink } from '../ui';
import { cx } from '../ui/lib/cx';
import { useForm, useReadOnly } from '../store/hooks';
import { useFixTools } from './fixes';
import { FixAllButton, JsonIssues } from './JsonIssues';
import styles from './JsonPane.module.css';
import { plainDefinition } from './sync';
import { useJsonSync, type JsonSyncState } from './useJsonSync';

function Status({ error, issues, onShow }: { error: JsonSyncState['error']; issues: unknown[]; onShow: () => void }) {
  if (error) {
    return (
      <span className={cx(styles.state, styles.danger)}>
        <CircleX aria-hidden />
        Line {error.line}: {error.message}
      </span>
    );
  }
  if (issues.length) {
    return (
      <button type="button" className={cx(styles.state, styles.warning, styles.show)} onClick={onShow}>
        <CircleAlert aria-hidden />
        {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
      </button>
    );
  }
  return (
    <span className={cx(styles.state, styles.success)}>
      <CircleCheck aria-hidden />
      Valid
    </span>
  );
}

export function JsonPane({ reveal = false, onRevealed }: { reveal?: boolean; onRevealed?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const { error, checked, ready, apply } = useJsonSync(host);
  const readOnly = useReadOnly();
  const tools = useFixTools();
  const form = useDeferredValue(useForm());
  const target = useMemo(() => checked ?? plainDefinition(form), [checked, form]);
  const issues = useMemo(() => (tools ? tools.suggestFixes(target) : checkDefinition(target)), [tools, target]);
  const list = useRef<HTMLUListElement>(null);
  const showIssues = () => {
    const node = list.current;
    if (!node) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  };
  const fixable = readOnly ? null : tools;
  useEffect(() => {
    if (!reveal) return;
    showIssues();
    onRevealed?.();
  });
  return (
    <div className={styles.pane}>
      <div className={styles.editor}>
        <div className={styles.bar}>
          <span className={styles.summary}>
            <span role="status">
              <Status error={error} issues={issues} onShow={showIssues} />
            </span>
            {!error && <FixAllButton issues={issues} tools={fixable} onApply={apply} />}
          </span>
          <TextLink href={SCHEMA_URL} external>
            Schema
          </TextLink>
        </div>
        <div className={styles.body}>
          {!ready && <Spinner className={styles.loading} label="Loading the JSON editor" />}
          <div ref={host} className={styles.host} />
        </div>
      </div>
      {error && (
        <Text as="p" size="sm" tone="muted">
          Visual keeps the last valid version until the JSON parses.
        </Text>
      )}
      {!error && issues.length > 0 && <JsonIssues issues={issues} tools={fixable} onApply={apply} listRef={list} />}
    </div>
  );
}
