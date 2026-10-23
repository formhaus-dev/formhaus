import type { FieldComponentProps } from '@formhaus/react';
import { Checkbox, Radio, Rate, Select, Switch, Typography } from 'antd';
import { FieldItem } from './FieldItem';

export function SelectField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const multiple = field.type === 'multiselect';
  return (
    <FieldItem id={id} field={field} error={error}>
      <Select
        id={id}
        mode={multiple ? 'multiple' : undefined}
        value={multiple ? (Array.isArray(value) ? value : []) : (value ?? undefined)}
        placeholder={field.placeholder ?? 'Select'}
        options={(field.options ?? []).map((option) => ({ value: option.value, label: option.label }))}
        loading={loading}
        disabled={disabled || loading}
        allowClear={!field.validation?.required}
        showSearch={field.type === 'autocomplete' ? { optionFilterProp: 'label' } : undefined}
        onChange={(next) => onChange(next ?? undefined)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FieldItem>
  );
}

export function RadioField({ id, field, value, error, loading, disabled, onChange, matrix }: FieldComponentProps) {
  if (matrix) {
    return (
      <Radio.Group
        id={id}
        className="matrix-row"
        aria-labelledby={`${id}-label`}
        value={value ?? null}
        disabled={disabled || loading}
        onChange={(event) => onChange(event.target.value)}
      >
        <span id={`${id}-label`} className="matrix-row__label">
          {field.label}
          {error && <Typography.Text type="danger">{error}</Typography.Text>}
        </span>
        {matrix.columns.map((column) => (
          <span key={column.value} className="matrix-row__cell">
            <Radio value={column.value} aria-label={column.label} />
          </span>
        ))}
      </Radio.Group>
    );
  }
  return (
    <FieldItem id={id} field={field} error={error}>
      <Radio.Group
        id={id}
        value={value ?? null}
        vertical={!field.options?.some((option) => option.image)}
        className={field.options?.some((option) => option.image) ? 'image-options' : undefined}
        disabled={disabled || loading}
        options={(field.options ?? []).map((option) => ({
          value: option.value,
          className: option.image ? 'image-option' : undefined,
          label: option.image ? (
            <>
              <img src={option.image} alt="" className="image-option__image" />
              <span>{option.label}</span>
            </>
          ) : (
            option.label
          ),
        }))}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldItem>
  );
}

export function ScaleField({ id, field, value, error, loading, disabled, onChange, onCommit }: FieldComponentProps) {
  const min = field.validation?.min ?? 1;
  const max = field.validation?.max ?? 5;
  const points = Array.from({ length: Math.min(11, Math.max(0, max - min + 1)) }, (_, index) => min + index);
  const anchor = (point: number) => field.options?.find((option) => option.value === String(point))?.label;
  const pick = field.autoAdvance && onCommit ? onCommit : onChange;
  return (
    <FieldItem id={id} field={field} error={error}>
      <Radio.Group
        id={id}
        optionType="button"
        buttonStyle="solid"
        block
        value={typeof value === 'number' ? value : null}
        disabled={disabled || loading}
        options={points.map((point) => ({ value: point, label: String(point) }))}
        onChange={(event) => pick(event.target.value)}
      />
      {(anchor(min) || anchor(max)) && (
        <div className="scale-anchors">
          <Typography.Text type="secondary">{anchor(min)}</Typography.Text>
          <Typography.Text type="secondary">{anchor(max)}</Typography.Text>
        </div>
      )}
    </FieldItem>
  );
}

export function RatingField({ id, field, value, error, loading, disabled, onChange }: FieldComponentProps) {
  return (
    <FieldItem id={id} field={field} error={error}>
      <Rate
        id={id}
        count={field.validation?.max ?? 5}
        value={typeof value === 'number' ? value : 0}
        disabled={disabled || loading}
        onChange={(next) => onChange(next || undefined)}
      />
    </FieldItem>
  );
}

export function CheckboxField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  return (
    <FieldItem id={id} field={field} error={error} label={null}>
      <Checkbox
        id={id}
        checked={value === true}
        disabled={disabled || loading}
        onChange={(event) => onChange(event.target.checked)}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        {field.label}
      </Checkbox>
    </FieldItem>
  );
}

export function SwitchField({ id, field, value, error, loading, disabled, onChange }: FieldComponentProps) {
  return (
    <FieldItem id={id} field={field} error={error} label={null}>
      <span className="switch-label">
        <Switch id={id} checked={value === true} loading={loading} disabled={disabled} onChange={(checked) => onChange(checked)} />
        <label htmlFor={id}>{field.label}</label>
      </span>
    </FieldItem>
  );
}
