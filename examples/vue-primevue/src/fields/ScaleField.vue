<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import SelectButton from 'primevue/selectbutton';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { scalePoints } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const scale = computed(() => scalePoints(props.field));
const options = computed(() => scale.value.points.map((point) => ({ label: String(point), value: point })));

function pick(value: number | null) {
  if (value === null) return;
  if (props.field.autoAdvance) emit('commit', value);
  else emit('update:modelValue', value);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error" kind="fieldset">
    <SelectButton
      :id="id"
      :model-value="modelValue"
      :options="options"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      :invalid="!!error"
      :aria-invalid="error ? true : undefined"
      :disabled="disabled || loading"
      :data-testid="testId"
      class="scale"
      @update:model-value="pick"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
    <div v-if="scale.start || scale.end" class="scale__anchors" aria-hidden="true">
      <span>{{ scale.start }}</span>
      <span>{{ scale.middle }}</span>
      <span>{{ scale.end }}</span>
    </div>
  </FieldShell>
</template>
