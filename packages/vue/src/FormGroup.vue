<script setup lang="ts">
import type { FieldOption, FormEngine, FormField, FormGroup, GroupItem, LabelKey, LabelSource } from '@formhaus/core';
import { errorDomId, fieldDomId, focusItem, itemDomId, itemLimits, itemTitle, labelFor } from '@formhaus/core/internal';
import { computed, defineComponent, h, nextTick, ref, type Component } from 'vue';
import DefaultGroup from './DefaultGroup.vue';
import DefaultGroupItem from './DefaultGroupItem.vue';
import FieldResolver from './FieldResolver.vue';
import { fieldAria } from './fields/useField';
import type { FieldComponentMap, GroupComponentProps } from './types';

const props = defineProps<{
  engine: FormEngine;
  formId: string;
  group: FormGroup;
  items: GroupItem[];
  value: unknown;
  errors: Readonly<Record<string, string>>;
  fieldLoading: Readonly<Record<string, boolean>>;
  disabled?: boolean;
  components?: FieldComponentMap;
  labels?: LabelSource;
  options: Record<string, FieldOption[]>;
}>();

const emit = defineEmits<{
  (e: 'update', key: string, value: unknown): void;
  (e: 'blur', key: string): void;
  (e: 'focus', key: string): void;
}>();

const status = ref('');
const id = computed(() => fieldDomId(props.formId, props.group.key));
const limits = computed(() => itemLimits(props.group));
const error = computed(() => props.errors[props.group.key]);
const values = computed(() => (Array.isArray(props.value) ? props.value : []) as Record<string, unknown>[]);
const label = (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params, props.labels, props.engine.definition.labels);
const title = (index: number) => itemTitle(props.group, index, props.labels, props.engine.definition.labels);
const remove = computed(() => props.group.removeLabel ?? label('removeItem'));

function itemProps(index: number, field: FormField) {
  const key = `${props.group.key}.${index}.${field.key}`;
  const options = props.options[field.key];
  const update = (value: unknown) => emit('update', key, value);
  return {
    id: errorDomId(props.engine, props.formId, key),
    field: { ...field, ...(options && { options }), key, autoAdvance: undefined },
    modelValue: values.value[index]?.[field.key],
    error: props.errors[key],
    loading: props.fieldLoading[key],
    disabled: props.disabled,
    components: props.components,
    'onUpdate:modelValue': update,
    onCommit: update,
    onBlur: () => emit('blur', key),
    onFocus: () => emit('focus', key),
  };
}

async function focusAfter(index: number, added: boolean) {
  await nextTick();
  focusItem(document, document.getElementById(id.value), props.formId, props.group.key, index, added);
}

function add() {
  const index = props.items.length;
  if (!props.engine.addItem(props.group.key)) return;
  status.value = label('itemAdded', { item: title(index) });
  void focusAfter(index, true);
}

function drop(index: number) {
  if (!props.engine.removeItem(props.group.key, index)) return;
  status.value = label('itemRemoved', { item: title(index) });
  void focusAfter(index, false);
}
const fieldComponents = new Map<string, Component>();

function fieldsOf(itemId: string): Component {
  let component = fieldComponents.get(itemId);
  if (!component) {
    component = defineComponent({
      name: 'GroupItemFields',
      setup: () => () => {
        const index = props.items.findIndex((item) => item.id === itemId);
        return index < 0
          ? null
          : props.items[index].fields.map((field) => h(FieldResolver, { key: field.key, ...itemProps(index, field) }));
      },
    });
    fieldComponents.set(itemId, component);
  }
  return component;
}

const groupProps = computed(
  (): GroupComponentProps => ({
    id: id.value,
    group: props.group,
    label: props.group.label,
    helperText: props.group.helperText,
    error: error.value,
    describedBy: fieldAria(props.group, id.value, error.value)['aria-describedby'],
    items: props.items.map((item, index) => ({
      id: item.id,
      index,
      title: title(index),
      titleId: itemDomId(props.formId, props.group.key, index),
      canRemove: props.items.length > limits.value[0],
      remove: () => drop(index),
      removeLabel: remove.value,
      disabled: props.disabled,
      fields: fieldsOf(item.id),
    })),
    canAdd: props.items.length < limits.value[1],
    add,
    remove: (key) => drop(props.items.findIndex((item) => item.id === key)),
    addLabel: props.group.addLabel ?? label('addItem'),
    removeLabel: remove.value,
    disabled: props.disabled,
    status: status.value,
    itemComponent: (props.components?.groupItem ?? DefaultGroupItem) as Component,
  }),
);
</script>

<template>
  <component :is="props.components?.group ?? DefaultGroup" v-bind="groupProps" />
</template>
