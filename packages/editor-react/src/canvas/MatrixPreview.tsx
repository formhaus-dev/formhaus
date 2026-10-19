import { childrenOf, hasOptions, type BuilderQuestion } from '@formhaus/builder';
import type { CSSProperties } from 'react';
import { useForm } from '../store/hooks';
import { cx } from '../ui/lib/cx';
import styles from './MatrixPreview.module.css';

export function MatrixPreview({ field }: { field: BuilderQuestion }) {
  const rows = childrenOf(useForm(), field.uid).filter((row) => hasOptions(row.type));
  const columns = (rows[0]?.options ?? []).map((option, index) => ({
    uid: option.uid,
    label: option.label.trim() || `Option ${String(index + 1)}`,
  }));
  if (!columns.length) return null;
  return (
    <div className={styles.matrix} style={{ '--columns': columns.length } as CSSProperties} aria-hidden>
      <div className={styles.header}>
        {columns.map((column) => (
          <span key={column.uid}>{column.label}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.uid} className={styles.row}>
          <span className={cx(styles.label, !row.label.trim() && styles.placeholder)}>{row.label.trim() || 'Untitled question'}</span>
          <div className={styles.cells}>
            {columns.map((column) => (
              <span key={column.uid} className={styles.cell}>
                <span className={cx(styles.glyph, row.type === 'multiselect' && styles.square)} />
                <span className={styles.caption}>{column.label}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
