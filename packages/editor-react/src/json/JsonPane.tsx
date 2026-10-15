import { SCHEMA_URL } from '@formhaus/builder';
import { checkDefinition } from '@formhaus/core';
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useDeferredValue, useMemo, useRef } from 'react';
import { Spinner, Text, TextLink } from '../ui';
import { cx } from '../ui/lib/cx';
import { useForm, useReadOnly } from '../store/hooks';
import { useFixTools } from './fixes';
import { JsonIssues } from './JsonIssues';
import styles from './JsonPane.module.css';
import { plainDefinition } from './sync';
import { useJsonSync, type JsonSyncState } from './useJsonSync';

function Status({ error, issues }: { error: JsonSyncState['error']; issues: unknown[] }) {
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
      <span className={cx(styles.state, styles.warning)}>
        <CircleAlert aria-hidden />
        {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
      </span>
    );
  }
  return (
    <span className={cx(styles.state, styles.success)}>
      <CircleCheck aria-hidden />
      Valid
    </span>
  );
}

export function JsonPane() {
  const host = useRef<HTMLDivElement>(null);
  const { error, checked, ready, apply } = useJsonSync(host);
  const readOnly = useReadOnly();
  const tools = useFixTools();
  const form = useDeferredValue(useForm());
  const target = useMemo(() => checked ?? plainDefinition(form), [checked, form]);
  const issues = useMemo(() => (tools ? tools.suggestFixes(target) : checkDefinition(target)), [tools, target]);
  return (
    <div className={styles.pane}>
      <div className={styles.editor}>
        <div className={styles.bar} role="status">
          <Status error={error} issues={issues} />
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
      {!error && issues.length > 0 && <JsonIssues issues={issues} tools={readOnly ? null : tools} onApply={apply} />}
    </div>
  );
}
