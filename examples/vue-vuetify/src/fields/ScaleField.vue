<script setup>
import { computed } from 'vue';

const props = defineProps({
  field: { type: Object, required: true },
  id: { type: String, default: undefined },
  modelValue: { default: undefined },
  error: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'commit', 'blur', 'focus']);

const min = computed(() => props.field.validation?.min ?? 1);
const max = computed(() => props.field.validation?.max ?? 5);
const points = computed(() =>
  Array.from({ length: Math.min(11, Math.max(0, max.value - min.value + 1)) }, (_, index) => min.value + index),
);
const anchor = (point) => props.field.options?.find((option) => option.value === String(point))?.label;

function pick(value) {
  if (value === null || value === undefined) return;
  emit(props.field.autoAdvance ? 'commit' : 'update:modelValue', value);
}
</script>

<template>
  <v-input :error-messages="error ? [error] : []" :hint="field.helperText" :persistent-hint="!!field.helperText">
    <div class="scale">
      <div :id="`${id}-label`" class="text-body-1 text-medium-emphasis mb-2">{{ field.label }}</div>
      <v-btn-toggle
        :model-value="typeof modelValue === 'number' ? modelValue : null"
        :aria-labelledby="`${id}-label`"
        :disabled="disabled || loading"
        color="primary"
        variant="outlined"
        divided
        mandatory="force"
        class="scale__group"
        @update:model-value="pick"
      >
        <v-btn v-for="point in points" :key="point" :value="point" class="scale__point">{{ point }}</v-btn>
      </v-btn-toggle>
      <div v-if="anchor(min) || anchor(max)" class="scale__anchors text-caption text-medium-emphasis">
        <span>{{ anchor(min) }}</span>
        <span>{{ anchor(max) }}</span>
      </div>
    </div>
  </v-input>
</template>

<style scoped>
.scale {
  width: 100%;
}

.scale__group {
  display: flex;
  width: 100%;
}

.scale__point {
  flex: 1 1 0;
  min-width: 0 !important;
}

.scale__anchors {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}
</style>
