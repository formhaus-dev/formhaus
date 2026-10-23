<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import Rating from 'primevue/rating';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { scalePoints } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const stars = computed(() => scalePoints(props.field).points.length);

function pick(value: number | null) {
  if (!value) return emit('update:modelValue', null);
  if (props.field.autoAdvance) emit('commit', value);
  else emit('update:modelValue', value);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error" kind="fieldset">
    <Rating
      :id="id"
      :name="field.key"
      :model-value="typeof modelValue === 'number' ? modelValue : 0"
      :stars="stars"
      :aria-invalid="error ? true : undefined"
      :disabled="disabled || loading"
      :data-testid="testId"
      :class="['rating', { 'rating--invalid': error }]"
      @update:model-value="pick"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
