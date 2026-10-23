<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElRate } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy, scalePoints } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const stars = computed(() => scalePoints(props.field).points.length);

function pick(value: number) {
  if (!value) emit('update:modelValue', null);
  else if (props.field.autoAdvance) emit('commit', value);
  else emit('update:modelValue', value);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error" kind="group">
    <ElRate
      :id="id"
      :model-value="typeof modelValue === 'number' ? modelValue : 0"
      :max="stars"
      :aria-label="field.label"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :data-testid="testId"
      clearable
      @update:model-value="pick"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
