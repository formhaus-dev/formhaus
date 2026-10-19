<script setup lang="ts">
import { scaleRange } from '@formhaus/core/internal';
import { computed } from 'vue';
import { formFieldEmits, formFieldProps } from '../props';
import FieldShell from './FieldShell.vue';
import { useChoice, useField } from './useField';

const props = defineProps(formFieldProps);
const emit = defineEmits(formFieldEmits);
const { inputId, control } = useField(props, emit);
const range = computed(() => scaleRange(props.field));
const points = computed(() => {
  const [min, max] = range.value;
  return Array.from({ length: Math.min(11, Math.max(0, max - min + 1)) }, (_, index) => min + index);
});
const roles = computed(() => {
  const [min, max] = range.value;
  return [min, Math.floor((min + max) / 2), max];
});
const anchors = computed(() =>
  roles.value.map((point, index) =>
    index === 1 && (point === roles.value[0] || point === roles.value[2])
      ? undefined
      : props.field.options?.find((option) => option.value === String(point)),
  ),
);
const anchorId = (point: number) => {
  const index = roles.value.findIndex((role, slot) => role === point && anchors.value[slot]);
  return index < 0 ? undefined : `${inputId.value}-anchor-${index}`;
};
const choice = useChoice(props, emit, (key) => {
  const [min, max] = range.value;
  const point = key === '0' && min > 0 ? 10 : Number(key);
  return /^\d$/.test(key) && point >= min && point <= max ? point : undefined;
});
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error" :variant="props.field.type === 'rating' ? 'rating' : 'scale'">
    <div v-for="point in points" :key="point" class="fh-field__scale-option">
      <input
        v-bind="{ ...control, ...choice(point) }"
        :id="`${inputId}-${point}`"
        class="fh-field__scale-input"
        type="radio"
        :name="props.field.key"
        :value="point"
        :checked="String(props.modelValue) === String(point)"
        :aria-describedby="anchorId(point)"
      />
      <label :for="`${inputId}-${point}`" class="fh-field__scale-label">{{ point }}</label>
    </div>
    <div v-if="anchors.some(Boolean)" class="fh-field__scale-anchors" :style="{ '--fh-scale-points': points.length }">
      <span v-for="(option, index) in anchors" :id="option && `${inputId}-anchor-${index}`" :key="index" class="fh-field__scale-anchor">{{
        option?.label
      }}</span>
    </div>
  </FieldShell>
</template>
