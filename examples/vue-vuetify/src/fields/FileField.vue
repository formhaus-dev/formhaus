<script setup>
defineProps({
  field: { type: Object, required: true },
  value: { default: undefined },
  error: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:value', 'blur', 'focus']);
</script>

<template>
  <v-file-input
    :id="field.key"
    :label="field.label"
    :accept="field.accept"
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
    @update:model-value="(files) => emit('update:value', files && files.length > 0 ? files[0] : null)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
