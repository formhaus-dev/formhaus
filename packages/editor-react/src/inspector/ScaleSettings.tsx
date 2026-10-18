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
import { Field, Input, SegmentedControl } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  readOnly: boolean;
}

const ANCHORS: [AnchorSlot, string][] = [
  ['start', 'Start label'],
  ['middle', 'Middle label'],
  ['end', 'End label'],
];

export function ScaleSettings({ field, actions, readOnly }: Props) {
  const [min, max] = scaleRange(field);
  const rating = field.type === 'rating';
  const limits = rating ? RATING_STARS : { min: min + SCALE_POINTS.min - 1, max: min + SCALE_POINTS.max - 1 };
  const anchors = anchorsOf(field);
  const setMax = (text: string) => {
    const value = Number.parseInt(text, 10);
    actions.edit((form) => {
      setScaleRange(form, field.uid, { max: Number.isNaN(value) ? undefined : value });
    }, `${field.uid}:max`);
  };
  return (
    <div className={styles.scale}>
      {!rating && (
        <div className={styles.control}>
          <span className={styles.controlLabel}>Starts at</span>
          <SegmentedControl
            label="Starts at"
            options={[
              { value: '0', label: '0' },
              { value: '1', label: '1' },
            ]}
            value={String(min)}
            onValueChange={(value) => {
              actions.edit((form) => {
                setScaleRange(form, field.uid, { min: value === '0' ? 0 : undefined });
              });
            }}
          />
        </div>
      )}
      <Field label={rating ? 'Stars' : 'Ends at'} hint={`From ${String(limits.min)} to ${String(limits.max)}`}>
        <Input
          type="number"
          inputMode="numeric"
          min={limits.min}
          max={limits.max}
          value={field.extra.validation?.max ?? ''}
          placeholder={String(max)}
          readOnly={readOnly}
          onChange={(event) => {
            setMax(event.target.value);
          }}
        />
      </Field>
      <div className={styles.anchors}>
        {ANCHORS.map(([slot, label]) => (
          <Field key={slot} label={label}>
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
