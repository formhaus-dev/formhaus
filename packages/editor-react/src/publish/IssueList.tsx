import { CircleAlert, TriangleAlert } from 'lucide-react';
import { Button } from '../ui';
import { cx } from '../ui/lib/cx';
import styles from './Publish.module.css';
import type { PublishProblem } from './problems';

interface Props {
  problems: PublishProblem[];
  onJump: (uid: string) => void;
  onPublishAnyway: (() => void) | undefined;
}

export function IssueList({ problems, onJump, onPublishAnyway }: Props) {
  const errors = problems.filter((problem) => problem.severity === 'error').length;
  return (
    <div className={styles.issues}>
      <p className={styles.heading}>
        {errors ? `Fix ${String(errors)} ${errors === 1 ? 'issue' : 'issues'} to publish` : 'Check before publishing'}
      </p>
      <ul className={styles.list}>
        {problems.map((problem, index) => {
          const Icon = problem.severity === 'error' ? CircleAlert : TriangleAlert;
          const body = (
            <>
              <Icon aria-hidden className={cx(styles.icon, styles[problem.severity])} />
              <span>{problem.message}</span>
            </>
          );
          const uid = problem.uid;
          return (
            <li key={`${String(index)}-${problem.message}`}>
              {uid ? (
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => {
                    onJump(uid);
                  }}
                >
                  {body}
                  <span className={styles.show}>Show</span>
                </button>
              ) : (
                <div className={styles.row}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {onPublishAnyway && (
        <Button variant="primary" onClick={onPublishAnyway}>
          Publish anyway
        </Button>
      )}
    </div>
  );
}
