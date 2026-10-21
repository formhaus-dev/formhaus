<script setup lang="ts">
import type { FieldOption, FormEngine, FormField, FormGroup, GroupItem, LabelKey, LabelSource } from '@formhaus/core';
import {
  errorDomId,
  fieldDomId,
  focusItem,
  itemDomId,
  itemHasContent,
  itemLimits,
  itemTitle,
  labelFor,
  optionKey,
  autofilled,
  recalled,
  shownOptions,
} from '@formhaus/core/internal';
import { computed, defineComponent, h, nextTick, ref, type Component } from 'vue';
import DefaultGroup from './DefaultGroup.vue';
import DefaultConfirmDialog from './DefaultConfirmDialog.vue';
import DefaultGroupItem from './DefaultGroupItem.vue';
import FieldResolver from './FieldResolver.vue';
import { fieldAria } from './fields/useField';
import { useMounted } from './composables/useMounted';
import type { ConfirmDialogComponentProps, FieldComponentMap, GroupComponentProps } from './types';

const props = withDefaults(
  defineProps<{
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
    confirmRemove?: boolean;
    onItemsChange: (key: string, apply: () => boolean) => boolean;
    recall?: unknown;
  }>(),
  { confirmRemove: true },
);

const emit = defineEmits<{
  (e: 'update', key: string, value: unknown): void;
  (e: 'blur', key: string): void;
  (e: 'focus', key: string): void;
}>();

const mounted = useMounted();
const status = ref('');
const announcements = ref(0);
const confirming = ref<string | null>(null);
const id = computed(() => fieldDomId(props.formId, props.group.key, props.engine.definition));
const limits = computed(() => itemLimits(props.group));
const error = computed(() => props.errors[props.group.key]);
const values = computed(() => (Array.isArray(props.value) ? props.value : []) as Record<string, unknown>[]);
const label = (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params, props.labels, props.engine.definition.labels);
const title = (index: number) => itemTitle(props.engine, props.group, index, props.labels, props.engine.definition.labels);
const remove = computed(() => props.group.removeLabel ?? label('removeItem'));

function itemProps(index: number, field: FormField) {
  const key = `${props.group.key}.${index}.${field.key}`;
  const options = shownOptions(props.engine, key, field, props.options[optionKey(props.group.key, field.key)], mounted.value);
  const update = (value: unknown) => emit('update', key, value);
  return {
    id: errorDomId(props.engine, props.formId, key),
    field: autofilled(
      props.engine,
      recalled(props.engine, { ...field, ...(options && { options }), key, autoAdvance: undefined }, key),
      key,
    ),
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
  focusItem(document, document.getElementById(id.value), props.formId, props.group.key, index, added, props.engine.definition);
}

function add() {
  const index = props.items.length;
  if (!props.onItemsChange(props.group.key, () => props.engine.addItem(props.group.key))) return;
  status.value = label('itemAdded', { item: title(index) });
  announcements.value++;
  void focusAfter(index, true);
}

function drop(index: number) {
  confirming.value = null;
  const item = title(index);
  if (!props.onItemsChange(props.group.key, () => props.engine.removeItem(props.group.key, index))) return;
  status.value = label('itemRemoved', { item });
  announcements.value++;
  void focusAfter(index, false);
}
async function focusId(target: string) {
  await nextTick();
  document.getElementById(target)?.focus();
}

function ask(index: number) {
  if (props.confirmRemove === false || !itemHasContent(props.engine, props.group.key, index)) return drop(index);
  confirming.value = props.items[index].id;
}

function keep(index: number) {
  confirming.value = null;
  void focusId(`${itemDomId(props.formId, props.group.key, index, undefined, props.engine.definition)}-remove`);
}

const fieldComponents = new Map<string, Component>();

function fieldsOf(itemId: string): Component {
  let component = fieldComponents.get(itemId);
  if (!component) {
    component = defineComponent({
      name: 'GroupItemFields',
      setup: () => () => {
        void props.recall;
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

const groupProps = computed((): GroupComponentProps => {
  void [values.value, props.recall];
  const texts = recalled(props.engine, props.group);
  return {
    id: id.value,
    group: props.group,
    label: texts.label,
    helperText: texts.helperText,
    error: error.value,
    describedBy: fieldAria(props.group, id.value, error.value)['aria-describedby'],
    items: props.items.map((item, index) => ({
      id: item.id,
      index,
      title: title(index),
      titleId: itemDomId(props.formId, props.group.key, index, undefined, props.engine.definition),
      canRemove: props.items.length > limits.value[0],
      remove: () => drop(index),
      requestRemove: () => ask(index),
      hasContent: itemHasContent(props.engine, props.group.key, index),
      removeLabel: remove.value,
      removeName: label('removeItemNamed', { label: remove.value, item: title(index) }),
      disabled: props.disabled,
      fields: fieldsOf(item.id),
    })),
    canAdd: props.items.length < limits.value[1],
    add,
    remove: (key) => drop(props.items.findIndex((item) => item.id === key)),
    requestRemove: (key) => ask(props.items.findIndex((item) => item.id === key)),
    addLabel: props.group.addLabel ?? label('addItem'),
    removeLabel: remove.value,
    disabled: props.disabled,
    status: status.value + (announcements.value % 2 ? '\u00a0' : ''),
    itemComponent: (props.components?.groupItem ?? DefaultGroupItem) as Component,
  };
});

const dialogProps = computed((): ConfirmDialogComponentProps | null => {
  const index = props.items.findIndex((item) => item.id === confirming.value);
  if (index < 0) return null;
  return {
    id: `${id.value}-confirm`,
    open: true,
    title: label('removeItemPrompt', { item: title(index) }),
    description: label('removeItemBody', { item: title(index) }),
    confirmLabel: label('removeItemNamed', { label: remove.value, item: title(index) }),
    cancelLabel: label('cancel'),
    confirm: () => drop(index),
    cancel: () => keep(index),
  };
});
</script>

<template>
  <component :is="props.components?.group ?? DefaultGroup" v-bind="groupProps" />
  <component :is="props.components?.confirmDialog ?? DefaultConfirmDialog" v-if="dialogProps" v-bind="dialogProps" />
</template>
