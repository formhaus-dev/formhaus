<script setup lang="ts">
import { computed, h } from 'vue';
import { useLabel } from '../composables/useLabel';
import { fieldShellProps } from '../innerProps';
import { fieldAria, fieldIds } from './useField';

const props = defineProps(fieldShellProps);

const text = useLabel();
const inline = computed(() => props.variant === 'checkbox' || props.variant === 'switch');
const group = computed(() => !!props.variant && !inline.value);
const ids = computed(() => fieldIds(props.field, props.id));
const container = computed(() => {
  const name = `fh-field__${props.variant === 'rating' ? 'scale' : props.variant}-${group.value ? 'group' : 'wrapper'}`;
  return group.value && props.field.layout === 'inline' ? [name, `${name}--inline`] : name;
});
const required = () =>
  !inline.value && props.field.validation?.required ? h('span', { class: 'fh-field__required', 'aria-hidden': 'true' }, ' *') : null;
const Label = () =>
  props.field.label
    ? h('label', { id: `${ids.value.inputId}-label`, for: ids.value.inputId, class: 'fh-field__label' }, [props.field.label, required()])
    : null;
const Legend = () =>
  props.field.label
    ? h('legend', { class: 'fh-field__label' }, [
        props.field.label,
        required(),
        props.field.validation?.required ? [' ', h('span', { class: 'fh-field__required-text' }, text('required'))] : null,
      ])
    : null;
const Message = () => (props.error ? h('p', { id: ids.value.errorId, class: 'fh-field__error', role: 'alert' }, props.error) : null);
const Helper = () =>
  props.field.helperText ? h('p', { id: ids.value.helperId, class: 'fh-field__helper' }, props.field.helperText) : null;
</script>

<template>
  <component
    :is="group ? 'fieldset' : 'div'"
    :class="['fh-field', props.variant && `fh-field--${props.variant}`]"
    v-bind="group ? fieldAria(props.field, props.id, props.error) : {}"
    :data-testid="props.testId"
  >
    <Legend v-if="group" />
    <Label v-if="!props.variant" />
    <Helper v-if="!inline" />
    <Message v-if="props.errorFirst" />
    <div v-if="props.variant" :class="container" :data-columns="props.field.columns">
      <slot />
      <Label v-if="inline" />
    </div>
    <slot v-else />
    <Helper v-if="inline" />
    <Message v-if="!props.errorFirst" />
  </component>
</template>
