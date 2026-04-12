<script setup>
const props = defineProps({
  field: { type: Object, required: true },
  value: { default: undefined },
  error: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:value', 'blur', 'focus']);

const inputType =
  props.field.type === 'email' ? 'email'
  : props.field.type === 'password' ? 'password'
  : props.field.type === 'number' ? 'number'
  : props.field.type === 'date' ? 'date'
  : props.field.type === 'phone' ? 'tel'
  : 'text';
</script>

<template>
  <v-text-field
    :id="field.key"
    :label="field.label"
    :type="inputType"
    :model-value="value != null ? String(value) : ''"
    :placeholder="field.placeholder"
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
    @update:model-value="(v) => emit('update:value', field.type === 'number' ? Number(v) : v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
