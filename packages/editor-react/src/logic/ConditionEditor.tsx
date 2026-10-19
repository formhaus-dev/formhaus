import {
  anchorsOf,
  hasOptions,
  isNumeric,
  isScale,
  OPERATOR_LABELS,
  scalePoints,
  operatorsFor,
  takesList,
  takesValue,
  type BuilderQuestion,
  type ConditionRow,
} from '@formhaus/builder';
import { X } from 'lucide-react';
import { Checkbox, cx, IconButton, Input, Select } from '../ui';
import styles from './Logic.module.css';
import { defaultRow } from './rows';

interface Props {
  row: ConditionRow;
  sources: BuilderQuestion[];
  readOnly: boolean;
  onChange: (row: ConditionRow) => void;
  onRemove: () => void;
}

function choicesOf(source: BuilderQuestion): { value: string; label: string }[] {
  if (!isScale(source.type)) {
    return source.options.map((option, index) => ({ value: option.value, label: option.label.trim() || `Option ${String(index + 1)}` }));
  }
  const points = scalePoints(source);
  const anchors = anchorsOf(source);
  const named = new Map([
    [points[0], anchors.start],
    [points[Math.floor((points.length - 1) / 2)], anchors.middle],
    [points.at(-1), anchors.end],
  ]);
  return points.map((point) => {
    const anchor = named.get(point);
    return { value: String(point), label: anchor ? `${String(point)} · ${anchor}` : String(point) };
  });
}

function Value({
  row,
  source,
  readOnly,
  onChange,
}: {
  row: ConditionRow;
  source: BuilderQuestion;
  readOnly: boolean;
  onChange: (row: ConditionRow) => void;
}) {
  const choices = hasOptions(source.type) || isScale(source.type) ? choicesOf(source) : null;
  if (choices && takesList(row.operator)) {
    const picked = Array.isArray(row.value) ? row.value : [];
    return (
      <div className={cx(styles.values, isScale(source.type) && styles.points)} role="group" aria-label="Values">
        {choices.map((option) => (
          <Checkbox
            key={option.value}
            label={isScale(source.type) ? option.value : option.label}
            checked={picked.includes(option.value)}
            disabled={readOnly}
            onChange={(event) => {
              const next = event.target.checked ? [...picked, option.value] : picked.filter((value) => value !== option.value);
              onChange({ ...row, value: next });
            }}
          />
        ))}
      </div>
    );
  }
  if (choices) {
    return (
      <Select
        aria-label="Value"
        value={typeof row.value === 'string' ? row.value : ''}
        disabled={readOnly}
        options={choices}
        onChange={(event) => {
          onChange({ ...row, value: event.target.value });
        }}
      />
    );
  }
  return (
    <Input
      aria-label="Value"
      type={isNumeric(source.type) ? 'number' : 'text'}
      inputMode={isNumeric(source.type) ? 'decimal' : undefined}
      value={typeof row.value === 'string' ? row.value : ''}
      readOnly={readOnly}
      onChange={(event) => {
        onChange({ ...row, value: event.target.value });
      }}
    />
  );
}

export function ConditionEditor({ row, sources, readOnly, onChange, onRemove }: Props) {
  const source = sources.find((item) => item.key === row.field);
  return (
    <div className={styles.condition}>
      <Select
        aria-label="Field"
        className={styles.source}
        value={row.field}
        disabled={readOnly}
        options={sources.map((item) => ({ value: item.key, label: item.label.trim() || item.key }))}
        onChange={(event) => {
          const next = sources.find((item) => item.key === event.target.value);
          if (next) onChange(defaultRow(next));
        }}
      />
      {!readOnly && <IconButton label="Remove condition" className={styles.remove} icon={<X aria-hidden />} onClick={onRemove} />}
      {source && (
        <>
          <Select
            aria-label="Operator"
            className={styles.operator}
            value={row.operator}
            disabled={readOnly}
            options={operatorsFor(source.type).map((operator) => ({ value: operator, label: OPERATOR_LABELS[operator] }))}
            onChange={(event) => {
              const operator = event.target.value as ConditionRow['operator'];
              const reset = takesList(row.operator) || row.value === '';
              onChange({ ...row, operator, value: takesList(operator) ? [] : reset ? defaultRow(source).value : row.value });
            }}
          />
          {takesValue(row.operator) && (
            <div className={styles.value}>
              <Value row={row} source={source} readOnly={readOnly} onChange={onChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
