import {
  hasOptions,
  OPERATOR_LABELS,
  operatorsFor,
  takesList,
  takesValue,
  type BuilderQuestion,
  type ConditionRow,
} from '@formhaus/builder';
import { X } from 'lucide-react';
import { Checkbox, IconButton, Input, Select } from '../ui';
import styles from './Logic.module.css';
import { defaultRow } from './rows';

interface Props {
  row: ConditionRow;
  sources: BuilderQuestion[];
  readOnly: boolean;
  onChange: (row: ConditionRow) => void;
  onRemove: () => void;
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
  if (hasOptions(source.type) && takesList(row.operator)) {
    const picked = Array.isArray(row.value) ? row.value : [];
    return (
      <div className={styles.values} role="group" aria-label="Values">
        {source.options.map((option, index) => (
          <Checkbox
            key={option.uid}
            label={option.label.trim() || `Option ${String(index + 1)}`}
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
  if (hasOptions(source.type)) {
    return (
      <Select
        aria-label="Value"
        value={typeof row.value === 'string' ? row.value : ''}
        disabled={readOnly}
        options={source.options.map((option, index) => ({
          value: option.value,
          label: option.label.trim() || `Option ${String(index + 1)}`,
        }))}
        onChange={(event) => {
          onChange({ ...row, value: event.target.value });
        }}
      />
    );
  }
  return (
    <Input
      aria-label="Value"
      type={source.type === 'number' ? 'number' : 'text'}
      inputMode={source.type === 'number' ? 'decimal' : undefined}
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
      <div className={styles.conditionHead}>
        <Select
          aria-label="Field"
          className={styles.grow}
          value={row.field}
          disabled={readOnly}
          options={sources.map((item) => ({ value: item.key, label: item.label.trim() || item.key }))}
          onChange={(event) => {
            const next = sources.find((item) => item.key === event.target.value);
            if (next) onChange(defaultRow(next));
          }}
        />
        {!readOnly && <IconButton label="Remove condition" icon={<X aria-hidden />} onClick={onRemove} />}
      </div>
      {source && (
        <>
          <Select
            aria-label="Operator"
            value={row.operator}
            disabled={readOnly}
            options={operatorsFor(source.type).map((operator) => ({ value: operator, label: OPERATOR_LABELS[operator] }))}
            onChange={(event) => {
              const operator = event.target.value as ConditionRow['operator'];
              onChange({ ...row, operator, value: takesList(operator) ? [] : takesList(row.operator) ? '' : row.value });
            }}
          />
          {takesValue(row.operator) && <Value row={row} source={source} readOnly={readOnly} onChange={onChange} />}
        </>
      )}
    </div>
  );
}
