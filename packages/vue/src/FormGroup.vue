<script setup lang="ts">
import type { FieldOption, FormEngine, FormGroup, GroupItem, LabelKey, LabelSource } from '@formhaus/core';
import { errorDomId, fieldDomId, itemDomId, itemLimits, itemTitle, labelFor } from '@formhaus/core/internal';
import { computed, nextTick, ref } from 'vue';
import FieldResolver from './FieldResolver.vue';
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
const path = (index: number, key: string) => `${props.group.key}.${index}.${key}`;
const describedBy = computed(
  () => [props.group.helperText && `${id.value}-helper`, error.value && `${id.value}-error`].filter(Boolean).join(' ') || undefined,
);

async function focusAfter(index: number, added: boolean) {
  await nextTick();
  const item = document.getElementById(itemDomId(props.formId, props.group.key, index));
  const next = added ? item?.parentElement?.querySelector<HTMLElement>('input, select, textarea') : item;
  (
    next ??
    root.value?.querySelector<HTMLElement>(':scope > .fh-group__add') ??
    document.getElementById(itemDomId(props.formId, props.group.key, index - 1))
  )?.focus();
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
  <fieldset ref="root" :id="id" class="fh-group" :aria-invalid="error ? true : undefined" :aria-describedby="describedBy">
    <legend class="fh-field__label">{{ props.group.label }}</legend>
    <p v-if="props.group.helperText" :id="`${id}-helper`" class="fh-field__helper">{{ props.group.helperText }}</p>
    <p v-if="error" :id="`${id}-error`" class="fh-field__error" role="alert">{{ error }}</p>
    <fieldset v-for="(item, index) in props.items" :key="item.id" class="fh-group__item">
      <legend :id="itemDomId(props.formId, props.group.key, index)" tabindex="-1" class="fh-group__title">{{ title(index) }}</legend>
      <FieldResolver
        v-for="field in item.fields"
        :key="field.key"
        :id="errorDomId(props.engine, props.formId, path(index, field.key))"
        :field="{ ...field, ...(props.options[field.key] && { options: props.options[field.key] }), key: path(index, field.key), autoAdvance: undefined }"
        :model-value="values[index]?.[field.key]"
        :error="props.errors[path(index, field.key)]"
        :loading="props.fieldLoading[path(index, field.key)]"
        :disabled="props.disabled"
        :components="props.components"
        @update:model-value="(v) => emit('update', path(index, field.key), v)"
        @commit="(v) => emit('update', path(index, field.key), v)"
        @blur="() => emit('blur', path(index, field.key))"
        @focus="() => emit('focus', path(index, field.key))"
      />
      <button v-if="props.items.length > limits[0]" type="button" class="fh-form-actions__button fh-form-actions__button--text fh-group__remove"
        :aria-label="`${remove} ${title(index)}`" :disabled="props.disabled" @click="drop(index)">{{ remove }}</button>
    </fieldset>
    <button v-if="props.items.length < limits[1]" type="button" class="fh-form-actions__button fh-form-actions__button--secondary fh-group__add"
      :disabled="props.disabled" @click="add">{{ props.group.addLabel ?? label('addItem') }}</button>
    <p class="fh-group__status" role="status">{{ status }}</p>
  </fieldset>
</template>
