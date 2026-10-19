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

const star = 'svg:M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z';
const starOutline =
  'svg:M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z';
</script>

<template>
  <v-input
    :error-messages="error ? [error] : []"
    :hint="field.helperText"
    :persistent-hint="!!field.helperText"
    :disabled="disabled || loading"
  >
    <div role="group" :aria-labelledby="`${id}-label`">
      <div :id="`${id}-label`" class="text-body-1 text-medium-emphasis mt-2 mb-1">{{ field.label }}</div>
      <v-rating
        :model-value="modelValue ?? 0"
        :length="field.validation?.max ?? 5"
        :disabled="disabled || loading"
        :full-icon="star"
        :empty-icon="starOutline"
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
