import { anchorsOf, hasOptions, isScale, placeholderFor, scalePoints, type BuilderForm, type BuilderQuestion } from '@formhaus/builder';
import { ChevronDown, EyeOff, Star } from 'lucide-react';
import { useCallback } from 'react';
import { cx } from '../ui/lib/cx';
import { targetsAfter } from '../logic/targets';
import { useEditor } from '../store/context';
import styles from './FieldPreview.module.css';
import { describeHidden } from './hiddenSources';

function jumpLabels(form: BuilderForm, field: BuilderQuestion): string {
  if (!field.options.some((option) => option.jump)) return '[]';
  const targets = targetsAfter(form, field.uid);
  return JSON.stringify(
    field.options.map((option) => (option.jump ? targets.find((item) => item.value === option.jump)?.label : undefined) ?? null),
  );
}

function Scale({ field }: { field: BuilderQuestion }) {
  const points = scalePoints(field);
  const anchors = anchorsOf(field);
  const rating = field.type === 'rating';
  return (
    <div className={styles.scale}>
      <ol
        className={cx(styles.points, rating && styles.stars, !rating && points.length > 6 && styles.wrap)}
        aria-label={rating ? `${String(points.length)} stars` : 'Points'}
      >
        {points.map((point) => (
          <li key={point} className={rating ? styles.star : styles.point}>
            {rating ? <Star aria-hidden /> : point}
          </li>
        ))}
      </ol>
      {(anchors.start || anchors.middle || anchors.end) && (
        <div className={styles.anchors}>
          <span>{anchors.start}</span>
          <span>{anchors.middle}</span>
          <span>{anchors.end}</span>
        </div>
      )}
    </div>
  );
}

function Choices({ field }: { field: BuilderQuestion }) {
  const square = field.type === 'multiselect';
  const labels = JSON.parse(useEditor(useCallback((state) => jumpLabels(state.form, field), [field]))) as (string | null)[];
  return (
    <ul className={cx(styles.choices, field.extra.layout === 'inline' && styles.inline)}>
      {field.options.map((option, index) => (
        <li key={option.uid} className={styles.choice}>
          <span className={cx(styles.glyph, square && styles.square)} aria-hidden />
          {option.extra?.image && <img className={styles.thumb} src={option.extra.image} alt="" />}
          <span className={cx(!option.label.trim() && styles.placeholder)}>{option.label.trim() || `Option ${String(index + 1)}`}</span>
          {labels[index] && <span className={styles.jump}>→ {labels[index]}</span>}
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
  if (field.type === 'hidden') {
    const { text, empty } = describeHidden(field);
    return (
      <div className={cx(styles.box, styles.hidden)}>
        <span className={cx(empty && styles.placeholder)}>{text}</span>
        <EyeOff aria-hidden className={styles.chevron} />
      </div>
    );
  }
  if (hasOptions(field.type)) return <Choices field={field} />;
  if (isScale(field.type)) return <Scale field={field} />;
  return (
    <div className={cx(styles.box, field.type === 'textarea' && styles.area)}>
      {hint && <span className={styles.placeholder}>{hint}</span>}
    </div>
  );
}
