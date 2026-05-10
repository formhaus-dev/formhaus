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
  <v-autocomplete
    :id="field.key"
    :label="field.label"
    :model-value="value ?? ''"
    :items="field.options ?? []"
    item-title="label"
    item-value="value"
    :placeholder="field.placeholder || 'Type to filter…'"
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
    @update:model-value="(v) => emit('update:value', v ?? '')"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
