<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import { computed, h } from 'vue';
import { fieldAria, fieldIds } from './useField';

const props = defineProps<{
  id?: string;
  field: FormField;
  error?: string;
  variant?: 'checkbox' | 'switch' | 'radio' | 'multiselect' | 'scale' | 'rating';
}>();

const inline = computed(() => props.variant === 'checkbox' || props.variant === 'switch');
const group = computed(() => !!props.variant && !inline.value);
const ids = computed(() => fieldIds(props.field, props.id));
const container = computed(() => {
  const name = `fh-field__${props.variant === 'rating' ? 'scale' : props.variant}-${group.value ? 'group' : 'wrapper'}`;
  return group.value && props.field.layout === 'inline' ? [name, `${name}--inline`] : name;
});
const required = () =>
  !props.variant && props.field.validation?.required ? h('span', { class: 'fh-field__required', 'aria-hidden': 'true' }, ' *') : null;
const Label = () =>
  props.field.label ? h('label', { for: ids.value.inputId, class: 'fh-field__label' }, [props.field.label, required()]) : null;
const Helper = () =>
  props.field.helperText ? h('p', { id: ids.value.helperId, class: 'fh-field__helper' }, props.field.helperText) : null;
</script>

<template>
  <component
    :is="group ? 'fieldset' : 'div'"
    :class="['fh-field', props.variant && `fh-field--${props.variant}`]"
    v-bind="group ? fieldAria(props.field, props.id, props.error) : {}"
  >
    <legend v-if="group && props.field.label" class="fh-field__label">
      {{ props.field.label }}
    </legend>
    <Label v-if="!props.variant" />
    <Helper v-if="!inline" />
    <div v-if="props.variant" :class="container" :data-columns="props.field.columns">
      <slot />
      <Label v-if="inline" />
    </div>
    <slot v-else />
    <Helper v-if="inline" />
    <p v-if="props.error" :id="ids.errorId" class="fh-field__error" role="alert">{{ props.error }}</p>
  </component>
</template>
