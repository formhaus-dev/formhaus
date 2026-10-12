<script setup>
const props = defineProps({
  field: { type: Object, required: true },
  id: { type: String, default: undefined },
  modelValue: { default: undefined },
  error: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);

const isMulti = props.field.type === 'multiselect';
</script>

<template>
  <v-select
    :id="id"
    :label="field.label"
    :model-value="isMulti ? (Array.isArray(modelValue) ? modelValue : []) : (modelValue ?? '')"
    :items="field.options ?? []"
    item-title="label"
    item-value="value"
    :multiple="isMulti"
    :placeholder="field.placeholder || 'Select...'"
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
