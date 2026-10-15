<script setup lang="ts">
import type { FieldOption, FormEngine, FormField, FormGroup, GroupItem, LabelKey, LabelSource } from '@formhaus/core';
import { errorDomId, fieldDomId, focusItem, itemDomId, itemLimits, itemTitle, labelFor } from '@formhaus/core/internal';
import { computed, nextTick, ref } from 'vue';
import FieldResolver from './FieldResolver.vue';
import { fieldAria } from './fields/useField';
import type { FieldComponentMap } from './types';

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

const root = ref<HTMLFieldSetElement>();
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
  focusItem(document, root.value, props.formId, props.group.key, index, added);
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
</script>

<template>
  <fieldset ref="root" :id="id" class="fh-group" v-bind="fieldAria(props.group, id, error)">
    <legend class="fh-field__label">{{ props.group.label }}</legend>
    <p v-if="props.group.helperText" :id="`${id}-helper`" class="fh-field__helper">{{ props.group.helperText }}</p>
    <p v-if="error" :id="`${id}-error`" class="fh-field__error" role="alert">{{ error }}</p>
    <fieldset v-for="(item, index) in props.items" :key="item.id" class="fh-group__item">
      <legend :id="itemDomId(props.formId, props.group.key, index)" tabindex="-1" class="fh-group__title">{{ title(index) }}</legend>
      <FieldResolver v-for="field in item.fields" :key="field.key" v-bind="itemProps(index, field)" />
      <button v-if="props.items.length > limits[0]" type="button" class="fh-form-actions__button fh-form-actions__button--text fh-group__remove"
        :aria-label="`${remove} ${title(index)}`" :disabled="props.disabled" @click="drop(index)">{{ remove }}</button>
    </fieldset>
    <button v-if="props.items.length < limits[1]" type="button" class="fh-form-actions__button fh-form-actions__button--secondary fh-group__add"
      :disabled="props.disabled" @click="add">{{ props.group.addLabel ?? label('addItem') }}</button>
    <p class="fh-group__status" role="status">{{ status }}</p>
  </fieldset>
</template>
