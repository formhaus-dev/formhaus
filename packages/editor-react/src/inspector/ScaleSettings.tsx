import {
  anchorsOf,
  RATING_STARS,
  SCALE_POINTS,
  scaleRange,
  setAnchor,
  setScaleRange,
  type AnchorSlot,
  type BuilderQuestion,
} from '@formhaus/builder';
import { useState } from 'react';
import { Field, Input, Select } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  readOnly: boolean;
}

const ANCHORS: [AnchorSlot, string][] = [
  ['start', 'Start label'],
  ['middle', 'Middle label (optional)'],
  ['end', 'End label'],
];

export function ScaleSettings({ field, actions, readOnly }: Props) {
  const [min, max] = scaleRange(field);
  const rating = field.type === 'rating';
  const limits = rating ? RATING_STARS : { min: min + SCALE_POINTS.min - 1, max: min + SCALE_POINTS.max - 1 };
  const anchors = anchorsOf(field);
  const stored = field.extra.validation?.max;
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const typed = Number.parseInt(draft, 10);
    const value = Number.isNaN(typed) ? undefined : Math.min(Math.max(typed, limits.min), limits.max);
    setDraft(null);
    if (value === stored) return;
    actions.edit((form) => {
      setScaleRange(form, field.uid, { max: value });
    });
  };
  return (
    <div className={styles.pair}>
      {!rating && (
        <Field label="Starts at" hint="0 or 1">
          <Select
            value={String(min)}
            disabled={readOnly}
            options={[
              { value: '0', label: '0' },
              { value: '1', label: '1' },
            ]}
            onChange={(event) => {
              const value = event.target.value;
              actions.edit((form) => {
                setScaleRange(form, field.uid, { min: value === '0' ? 0 : undefined });
              });
            }}
          />
        </Field>
      )}
      <Field label={rating ? 'Stars' : 'Ends at'} hint={`From ${String(limits.min)} to ${String(limits.max)}`}>
        <Input
          type="number"
          inputMode="numeric"
          min={limits.min}
          max={limits.max}
          value={draft ?? stored ?? ''}
          placeholder={String(max)}
          readOnly={readOnly}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
          }}
        />
      </Field>
      <div className={styles.pair}>
        {ANCHORS.map(([slot, label]) => (
          <Field key={slot} label={label} className={slot === 'middle' ? styles.middle : undefined}>
            <Input
              value={anchors[slot]}
              placeholder={slot === 'start' ? 'Not likely' : slot === 'end' ? 'Very likely' : 'Neutral'}
              readOnly={readOnly || (slot === 'middle' && max - min < 2)}
              onChange={(event) => {
                actions.edit((form) => {
                  setAnchor(form, field.uid, slot, event.target.value);
                }, `${field.uid}:anchor:${slot}`);
              }}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}
