import { groups, pageTitle } from '@formhaus/builder';
import { CircleAlert } from 'lucide-react';
import { cx } from '../ui/lib/cx';
import { revealStep } from '../canvas/focus';
import { useEditorStore } from '../store/context';
import { useForm, useIssues, useSelection, useStepOf } from '../store/hooks';
import styles from './StepOutline.module.css';

export function StepOutline() {
  const form = useForm();
  const store = useEditorStore();
  const selection = useSelection();
  const issues = useIssues();
  const active = useStepOf(selection);
  const parts = groups(form).filter((part) => part.page);
  if (parts.length < 2) return null;
  return (
    <nav className={styles.outline} aria-label="Steps">
      <ol className={styles.list}>
        {parts.map((part, index) => {
          const page = part.page;
          if (!page) return null;
          const count = [page.uid, ...part.questions.map((field) => field.uid)].reduce(
            (sum, uid) => sum + (issues.get(uid)?.filter((issue) => issue.severity === 'error').length ?? 0),
            0,
          );
          return (
            <li key={page.uid}>
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
                    {count} <span className="fh-ed-sr-only">{count === 1 ? 'issue' : 'issues'}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
