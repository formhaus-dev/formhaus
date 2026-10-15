import type { FieldOption, FormEngine, FormGroup, LabelKey } from '@formhaus/core';
import { fieldDomId, focusItem, itemDomId, itemHasContent, itemLimits, itemTitle, labelFor } from '@formhaus/core/internal';
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
  confirmRemove?: boolean;
}

type Focus = { index: number; added: boolean } | { id: string } | null;

export const FormGroupController = memo(function FormGroupController({
  group,
  disabled,
  options,
  labels,
  confirmRemove = true,
  ...props
}: FormGroupControllerProps) {
  const { engine, formId } = props;
  useFieldSnapshot(engine, group.key);
  useStructureSnapshot(engine);
  const [status, setStatus] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const focus = useRef<Focus>(null);
  const label = (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params, labels, engine.definition.labels);
  const items = engine.items(group.key);
  const values = (engine.values[group.key] ?? []) as Record<string, unknown>[];
  const [min, max] = itemLimits(group);
  const id = fieldDomId(formId, group.key, engine.definition);
  const error = engine.errors[group.key];
  const title = (index: number) => itemTitle(group, index, labels, engine.definition.labels);
  const remove = group.removeLabel ?? label('removeItem');

  useEffect(() => {
    const target = focus.current;
    focus.current = null;
    if (target && 'id' in target) document.getElementById(target.id)?.focus();
    else if (target) focusItem(document, document.getElementById(id), formId, group.key, target.index, target.added, engine.definition);
  });

  const add = () => {
    if (!engine.addItem(group.key)) return;
    focus.current = { index: items.length, added: true };
    setStatus(label('itemAdded', { item: title(items.length) }));
  };
  const drop = (index: number) => {
    setConfirming(null);
    if (!engine.removeItem(group.key, index)) return;
    focus.current = { index, added: false };
    setStatus(label('itemRemoved', { item: title(index) }));
  };

  const ask = (index: number) => {
    if (!confirmRemove || !itemHasContent(engine, group.key, index)) return drop(index);
    setConfirming(items[index].id);
    focus.current = { id: `${itemDomId(formId, group.key, index, undefined, engine.definition)}-confirm` };
    setStatus(label('removeItemPrompt', { item: title(index) }));
  };
  const keep = (index: number) => {
    setConfirming(null);
    focus.current = { id: `${itemDomId(formId, group.key, index, undefined, engine.definition)}-remove` };
  };

  const { components } = props;
  const Group = (components?.group ?? DefaultGroup) as ComponentType<GroupComponentProps>;
  const ItemComponent = (components?.groupItem ?? DefaultGroupItem) as ComponentType<GroupItemComponentProps>;
  const entries = items.map(
    (item, index): GroupItemComponentProps => ({
      id: item.id,
      index,
      title: title(index),
      titleId: itemDomId(formId, group.key, index, undefined, engine.definition),
      canRemove: items.length > min,
      remove: () => drop(index),
      requestRemove: () => ask(index),
      confirming: confirming === item.id,
      hasContent: itemHasContent(engine, group.key, index),
      cancelRemove: () => keep(index),
      prompt: label('removeItemPrompt', { item: title(index) }),
      keepLabel: label('keepItem'),
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
      requestRemove={(key) => ask(items.findIndex((item) => item.id === key))}
      addLabel={group.addLabel ?? label('addItem')}
      removeLabel={remove}
      disabled={disabled}
      status={status}
      ItemComponent={ItemComponent}
    />
  );
});
