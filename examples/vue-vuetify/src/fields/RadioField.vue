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
  <v-radio-group
    :model-value="modelValue ?? ''"
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
    :label="field.label"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  >
    <v-radio
      v-for="opt in (field.options ?? [])"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    />
  </v-radio-group>
</template>
