<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy, fromDate, toDate } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const type = computed(() => props.field.type);
const placeholders: Record<string, string> = { date: 'YYYY-MM-DD', datetime: 'YYYY-MM-DD HH:mm', time: 'HH:mm' };

function typed(event: Event) {
  const text = (event.target as HTMLInputElement).value.trim().replace(' ', 'T');
  if (!text) emit('update:modelValue', '');
  else if (fromDate(toDate(text, type.value), type.value) === text) emit('update:modelValue', text);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <DatePicker
      :input-id="id"
      :name="field.key"
      :model-value="toDate(modelValue, type)"
      date-format="yy-mm-dd"
      hour-format="24"
      :show-time="type === 'datetime'"
      :time-only="type === 'time'"
      :placeholder="field.placeholder ?? placeholders[type]"
      :show-icon="type !== 'time'"
      icon-display="input"
      :invalid="!!error"
      :input-props="{ 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy(id, field, error), 'data-testid': testId }"
      :disabled="disabled || loading"
      fluid
      @update:model-value="emit('update:modelValue', fromDate($event, type))"
      @input="typed"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
