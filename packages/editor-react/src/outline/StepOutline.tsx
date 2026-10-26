import { groups, pageTitle } from '@formhaus/builder';
import { CircleAlert } from 'lucide-react';
import { Tooltip } from '../ui';
import { cx } from '../ui/lib/cx';
import { issueText } from '../canvas/issueText';
import { revealStep } from '../canvas/focus';
import { useEditorStore } from '../store/context';
import { useForm, useIssues, useSelection, useStepOf } from '../store/hooks';
import styles from './StepOutline.module.css';

export function StepOutline({ row = false }: { row?: boolean }) {
  const form = useForm();
  const store = useEditorStore();
  const selection = useSelection();
  const issues = useIssues();
  const active = useStepOf(selection);
  const parts = groups(form).filter((part) => part.page);
  if (parts.length < 2) return null;
  return (
    <nav className={cx(styles.outline, row && styles.row)} aria-label="Steps">
      <ol className={styles.list}>
        {parts.map((part, index) => {
          const page = part.page;
          if (!page) return null;
          const messages = [page.uid, ...part.questions.map((field) => field.uid)].flatMap((uid) =>
            (issues.get(uid) ?? []).filter((issue) => issue.severity === 'error').map(issueText),
          );
          const count = messages.length;
          const button = (
            <button
              type="button"
              className={cx(styles.item, active === page.uid && styles.active)}
              aria-current={active === page.uid ? 'step' : undefined}
              onClick={() => {
                store.select({ kind: 'step', uid: page.uid });
                requestAnimationFrame(() => {
                  revealStep(page.uid, true);
                });
              }}
            >
              <span className={styles.number}>{index + 1}</span>
              <span className={styles.text}>
                <span className={styles.title}>{pageTitle(page, index)}</span>
                <span className={styles.meta}>
                  {part.questions.length} {part.questions.length === 1 ? 'field' : 'fields'}
                </span>
              </span>
              {count > 0 && (
                <span className={styles.issues}>
                  <CircleAlert aria-hidden />
                  {count} <span className="fh-ed-sr-only">{`${count === 1 ? 'issue' : 'issues'}: ${messages.join(' ')}`}</span>
                </span>
              )}
            </button>
          );
          const tip = (
            <ul className={styles.tip}>
              {messages.map((message, at) => (
                <li key={`${String(at)}:${message}`}>{message}</li>
              ))}
            </ul>
          );
          return (
            <li key={page.uid}>
              {count > 0 ? (
                <Tooltip content={tip} side={row ? 'bottom' : 'right'}>
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
