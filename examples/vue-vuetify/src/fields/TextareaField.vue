<script setup>
defineProps({
  field: { type: Object, required: true },
  id: { type: String, default: undefined },
  modelValue: { default: undefined },
  error: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);
</script>

<template>
  <v-textarea
    :id="id"
    :label="field.label"
    :model-value="modelValue ?? ''"
    :placeholder="field.placeholder"
    :rows="field.rows ?? 3"
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
