<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import { computed, h } from 'vue';
import { fieldAria, fieldIds } from './useField';

const props = defineProps<{
  field: FormField;
  error?: string;
  variant?: 'checkbox' | 'switch' | 'radio' | 'multiselect';
}>();

const group = computed(() => props.variant === 'radio' || props.variant === 'multiselect');
const ids = computed(() => fieldIds(props.field));
const Label = () => props.field.label
  ? h('label', { for: ids.value.inputId, class: 'fh-field__label' }, props.field.label)
  : null;
</script>

<template>
  <component
    :is="group ? 'fieldset' : 'div'"
    :class="['fh-field', props.variant && `fh-field--${props.variant}`]"
    v-bind="group ? fieldAria(props.field, props.error) : {}"
  >
    <legend v-if="group && props.field.label" class="fh-field__label">
      {{ props.field.label }}
    </legend>
    <div v-if="props.variant" :class="`fh-field__${props.variant}-${group ? 'group' : 'wrapper'}`">
      <slot />
      <Label v-if="!group" />
    </div>
    <template v-else>
      <Label />
      <slot />
    </template>
    <p v-if="props.error" :id="ids.helperId" class="fh-field__error">{{ props.error }}</p>
    <p v-else-if="props.field.helperText" :id="ids.helperId" class="fh-field__helper">{{ props.field.helperText }}</p>
  </component>
</template>
