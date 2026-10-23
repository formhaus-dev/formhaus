<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElDatePicker, ElTimePicker } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const formats: Record<string, { value: string; shown: string }> = {
  date: { value: 'YYYY-MM-DD', shown: 'YYYY-MM-DD' },
  datetime: { value: 'YYYY-MM-DDTHH:mm', shown: 'YYYY-MM-DD HH:mm' },
  time: { value: 'HH:mm', shown: 'HH:mm' },
};
const format = computed(() => formats[props.field.type] ?? formats.date!);
const control = computed(() => (props.field.type === 'time' ? ElTimePicker : ElDatePicker));
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <component
      :is="control"
      :id="id"
      :name="field.key"
      :type="field.type === 'time' ? undefined : field.type"
      :model-value="typeof modelValue === 'string' && modelValue ? modelValue : null"
      :value-format="format.value"
      :format="format.shown"
      :placeholder="field.placeholder ?? format.shown"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :validate-event="false"
      :data-testid="testId"
      class="field__control"
      @update:model-value="emit('update:modelValue', $event ?? '')"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
