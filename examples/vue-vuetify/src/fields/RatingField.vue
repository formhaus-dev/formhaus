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
  <v-input
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
  >
    <div role="group" :aria-labelledby="`${id}-label`">
      <div :id="`${id}-label`" class="text-body-1 text-medium-emphasis mb-1">{{ field.label }}</div>
      <v-rating
        :model-value="modelValue ?? 0"
        :length="field.validation?.max ?? 5"
        :disabled="disabled || loading"
        active-color="amber-darken-2"
        density="comfortable"
        hover
        @update:model-value="(v) => emit('update:modelValue', v || undefined)"
        @blur="emit('blur')"
        @focus="emit('focus')"
      />
    </div>
  </v-input>
</template>
