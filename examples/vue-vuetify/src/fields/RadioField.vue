<script setup>
defineProps({
  field: { type: Object, required: true },
  id: { type: String, default: undefined },
  modelValue: { default: undefined },
  error: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  matrix: { type: Object, default: undefined },
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);
</script>

<template>
  <div v-if="matrix" class="matrix-row">
    <div :id="`${id}-label`" class="matrix-row__label text-body-2">
      {{ field.label }}
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </div>
    <v-radio-group
      :model-value="modelValue ?? null"
      :aria-labelledby="`${id}-label`"
      :disabled="disabled || loading"
      :error="!!error"
      inline
      hide-details
      class="matrix-row__group"
      @update:model-value="(v) => emit('update:modelValue', v)"
    >
      <v-radio
        v-for="column in matrix.columns"
        :key="column.value"
        :value="column.value"
        :aria-label="column.label"
        class="matrix-row__cell"
      />
    </v-radio-group>
  </div>
  <v-radio-group
    v-else
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
