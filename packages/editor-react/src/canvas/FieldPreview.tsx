import { hasOptions, placeholderFor, type BuilderQuestion } from '@formhaus/builder';
import { ChevronDown } from 'lucide-react';
import { cx } from '../ui/lib/cx';
import { targetsAfter } from '../logic/targets';
import { useForm } from '../store/hooks';
import styles from './FieldPreview.module.css';

function Choices({ field }: { field: BuilderQuestion }) {
  const square = field.type === 'multiselect';
  const targets = targetsAfter(useForm(), field.uid);
  const jump = (target: string | null) => (target ? targets.find((item) => item.value === target)?.label : undefined);
  return (
    <ul className={cx(styles.choices, field.extra.layout === 'inline' && styles.inline)}>
      {field.options.map((option, index) => (
        <li key={option.uid} className={styles.choice}>
          <span className={cx(styles.glyph, square && styles.square)} aria-hidden />
          <span className={cx(!option.label.trim() && styles.placeholder)}>{option.label.trim() || `Option ${String(index + 1)}`}</span>
          {jump(option.jump) && <span className={styles.jump}>→ {jump(option.jump)}</span>}
        </li>
      ))}
    </ul>
  );
}

export function FieldPreview({ field }: { field: BuilderQuestion }) {
  const hint = field.extra.placeholder ?? '';
  if (field.type === 'checkbox' || field.type === 'switch') {
    return (
      <div className={styles.choice}>
        <span className={cx(styles.glyph, field.type === 'switch' ? styles.toggle : styles.square)} aria-hidden />
        <span className={styles.placeholder}>{hint || placeholderFor(field.type)}</span>
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div className={styles.box}>
        <span className={styles.placeholder}>{hint || 'Choose…'}</span>
        <ChevronDown aria-hidden className={styles.chevron} />
      </div>
    );
  }
  if (hasOptions(field.type)) return <Choices field={field} />;
  return (
    <div className={cx(styles.box, field.type === 'textarea' && styles.area)}>
      {hint && <span className={styles.placeholder}>{hint}</span>}
    </div>
  );
}
