import type { FieldOption, FormEngine, FormGroup, LabelKey } from '@formhaus/core';
import { fieldDomId, focusItem, itemDomId, itemLimits, itemTitle, labelFor } from '@formhaus/core/internal';
import { memo, useEffect, useRef, useState, type ComponentType } from 'react';
import { DefaultGroup, DefaultGroupItem } from './ContainerViews';
import { type ControllerProps, FormFieldController } from './FormFieldController';
import { describedBy } from './fields/fieldProps';
import { useFieldSnapshot, useStructureSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps, GroupComponentProps, GroupItemComponentProps } from './types';

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
    if (target) focusItem(document, document.getElementById(id), formId, group.key, target.index, target.added);
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

  const { components } = props;
  const Group = (components?.group ?? DefaultGroup) as ComponentType<GroupComponentProps>;
  const ItemComponent = (components?.groupItem ?? DefaultGroupItem) as ComponentType<GroupItemComponentProps>;
  const entries = items.map(
    (item, index): GroupItemComponentProps => ({
      id: item.id,
      index,
      title: title(index),
      titleId: itemDomId(formId, group.key, index),
      canRemove: items.length > min,
      remove: () => drop(index),
      removeLabel: remove,
      disabled,
      children: item.fields.map((field) => (
        <FormFieldController
          key={field.key}
          {...props}
          field={field}
          options={options[field.key]}
          disabled={disabled}
          path={`${group.key}.${index}.${field.key}`}
          item={values[index]}
        />
      )),
    }),
  );

  return (
    <Group
      id={id}
      group={group}
      label={group.label}
      helperText={group.helperText}
      error={error}
      describedBy={describedBy(group, id, error)}
      items={entries}
      canAdd={items.length < max}
      add={add}
      remove={(key) => drop(items.findIndex((item) => item.id === key))}
      addLabel={group.addLabel ?? label('addItem')}
      removeLabel={remove}
      disabled={disabled}
      status={status}
      ItemComponent={ItemComponent}
    />
  );
});
