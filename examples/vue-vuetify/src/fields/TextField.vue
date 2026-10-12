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

const inputType =
  props.field.type === 'email' ? 'email'
  : props.field.type === 'password' ? 'password'
  : props.field.type === 'number' ? 'number'
  : props.field.type === 'date' ? 'date'
  : props.field.type === 'datetime' ? 'datetime-local'
  : props.field.type === 'phone' ? 'tel'
  : 'text';
</script>

<template>
  <v-text-field
    :id="id"
    :label="field.label"
    :type="inputType"
    :model-value="modelValue != null ? String(modelValue) : ''"
    :placeholder="field.placeholder"
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
    @update:model-value="(v) => emit('update:modelValue', field.type === 'number' && v !== '' ? Number(v) : v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
