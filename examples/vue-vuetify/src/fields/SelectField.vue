<script setup>
const props = defineProps({
  field: { type: Object, required: true },
  value: { default: undefined },
  error: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:value', 'blur', 'focus']);

const isMulti = props.field.type === 'multiselect';
</script>

<template>
  <v-select
    :id="field.key"
    :label="field.label"
    :model-value="isMulti ? (Array.isArray(value) ? value : []) : (value ?? '')"
    :items="field.options ?? []"
    item-title="label"
    item-value="value"
    :multiple="isMulti"
    :placeholder="field.placeholder || 'Select...'"
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
    @update:model-value="(v) => emit('update:value', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
