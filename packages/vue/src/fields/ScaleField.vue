<script setup lang="ts">
import { scaleView } from '@formhaus/core/fields';
import { computed } from 'vue';
import { fieldComponentEmits, fieldComponentProps } from '../props';
import FieldShell from './FieldShell.vue';
import { useChoice, useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const { inputId, control } = useField(props, emit);
const view = computed(() => scaleView(props.field));
const points = computed(() => view.value.points);
const anchors = computed(() => view.value.anchors);
const anchorId = (point: number) => {
  const index = anchors.value.findIndex((anchor) => anchor?.point === point);
  return index < 0 ? undefined : `${inputId.value}-anchor-${index}`;
};
const choice = useChoice(props, emit, (key) => {
  const { min, max } = view.value;
  const point = key === '0' && min > 0 ? 10 : Number(key);
  return /^\d$/.test(key) && point >= min && point <= max ? point : undefined;
});
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error" :test-id="props.testId" :variant="props.field.type === 'rating' ? 'rating' : 'scale'">
    <div v-for="point in points" :key="point" class="fh-field__scale-option">
      <input
        v-bind="{ ...control, ...choice(point) }"
        :id="`${inputId}-${point}`"
        class="fh-field__scale-input"
        :data-testid="props.optionTestId?.(String(point))"
        type="radio"
        :name="props.field.key"
        :value="point"
        :checked="String(props.modelValue) === String(point)"
        :aria-describedby="anchorId(point)"
      />
      <label :for="`${inputId}-${point}`" class="fh-field__scale-label">{{ point }}</label>
    </div>
    <div v-if="anchors.some(Boolean)" class="fh-field__scale-anchors" :style="{ '--fhi-scale-points': points.length }">
      <span v-for="(option, index) in anchors" :id="option && `${inputId}-anchor-${index}`" :key="index" class="fh-field__scale-anchor">{{
        option?.label
      }}</span>
    </div>
  </FieldShell>
</template>
