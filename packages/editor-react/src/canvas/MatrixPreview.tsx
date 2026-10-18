import { childrenOf, hasOptions, type BuilderQuestion } from '@formhaus/builder';
import type { CSSProperties } from 'react';
import { useForm } from '../store/hooks';
import { cx } from '../ui/lib/cx';
import styles from './MatrixPreview.module.css';

export function MatrixPreview({ field }: { field: BuilderQuestion }) {
  const rows = childrenOf(useForm(), field.uid).filter((row) => hasOptions(row.type));
  const columns = rows[0]?.options ?? [];
  if (!columns.length) return null;
  return (
    <div className={styles.matrix} style={{ '--columns': columns.length } as CSSProperties} aria-hidden>
      <div className={styles.header}>
        {columns.map((option, index) => (
          <span key={option.uid}>{option.label.trim() || `Option ${String(index + 1)}`}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.uid} className={styles.row}>
          <span className={cx(styles.label, !row.label.trim() && styles.placeholder)}>{row.label.trim() || 'Untitled question'}</span>
          <div className={styles.cells}>
            {columns.map((option) => (
              <span key={option.uid} className={cx(styles.glyph, row.type === 'multiselect' && styles.square)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
