import type { FieldOption, FormEngine, FormGroup, LabelKey } from '@formhaus/core';
import { fieldDomId, focusItem, itemDomId, itemLimits, itemTitle, labelFor } from '@formhaus/core/internal';
import { memo, useEffect, useRef, useState } from 'react';
import { type ControllerProps, FormFieldController } from './FormFieldController';
import { describedBy } from './fields/fieldProps';
import { useFieldSnapshot, useStructureSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormGroupControllerProps extends ControllerProps {
  group: FormGroup;
  disabled?: boolean;
  options: Record<string, FieldOption[]>;
  labels?: FormRendererProps['labels'];
}

type Focus = { index: number; added: boolean } | null;

export const FormGroupController = memo(function FormGroupController({
  group,
  disabled,
  options,
  labels,
  ...props
}: FormGroupControllerProps) {
  const { engine, formId } = props;
  useFieldSnapshot(engine, group.key);
  useStructureSnapshot(engine);
  const [status, setStatus] = useState('');
  const focus = useRef<Focus>(null);
  const root = useRef<HTMLFieldSetElement>(null);
  const label = (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params, labels, engine.definition.labels);
  const items = engine.items(group.key);
  const values = (engine.values[group.key] ?? []) as Record<string, unknown>[];
  const [min, max] = itemLimits(group);
  const id = fieldDomId(formId, group.key);
  const error = engine.errors[group.key];
  const title = (index: number) => itemTitle(group, index, labels, engine.definition.labels);
  const remove = group.removeLabel ?? label('removeItem');

  useEffect(() => {
    const target = focus.current;
    focus.current = null;
    if (target) focusItem(document, root.current, formId, group.key, target.index, target.added);
  });

  const add = () => {
    if (!engine.addItem(group.key)) return;
    focus.current = { index: items.length, added: true };
    setStatus(label('itemAdded', { item: title(items.length) }));
  };
  const drop = (index: number) => {
    if (!engine.removeItem(group.key, index)) return;
    focus.current = { index, added: false };
    setStatus(label('itemRemoved', { item: title(index) }));
  };

  return (
    <fieldset ref={root} id={id} className="fh-group" aria-invalid={!!error || undefined} aria-describedby={describedBy(group, id, error)}>
      <legend className="fh-field__label">{group.label}</legend>
      {group.helperText && (
        <p id={`${id}-helper`} className="fh-field__helper">
          {group.helperText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="fh-field__error" role="alert">
          {error}
        </p>
      )}
      {items.map((item, index) => (
        <fieldset key={item.id} className="fh-group__item">
          <legend id={itemDomId(formId, group.key, index)} tabIndex={-1} className="fh-group__title">
            {title(index)}
          </legend>
          {item.fields.map((field) => (
            <FormFieldController
              key={field.key}
              {...props}
              field={field}
              options={options[field.key]}
              disabled={disabled}
              path={`${group.key}.${index}.${field.key}`}
              item={values[index]}
            />
          ))}
          {items.length > min && (
            <button
              type="button"
              className="fh-form-actions__button fh-form-actions__button--text fh-group__remove"
              aria-label={`${remove} ${title(index)}`}
              disabled={disabled}
              onClick={() => drop(index)}
            >
              {remove}
            </button>
          )}
        </fieldset>
      ))}
      {items.length < max && (
        <button
          type="button"
          className="fh-form-actions__button fh-form-actions__button--secondary fh-group__add"
          disabled={disabled}
          onClick={add}
        >
          {group.addLabel ?? label('addItem')}
        </button>
      )}
      <p className="fh-group__status" role="status">
        {status}
      </p>
    </fieldset>
  );
});
