<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import InputNumber from 'primevue/inputnumber';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <InputNumber
      :input-id="id"
      :name="field.key"
      :model-value="typeof modelValue === 'number' ? modelValue : null"
      :placeholder="field.placeholder"
      :use-grouping="false"
      :max-fraction-digits="field.inputMode === 'numeric' ? 0 : 4"
      :invalid="!!error"
      :input-props="{
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy(id, field, error),
        'data-testid': testId,
      }"
      :disabled="disabled || loading"
      fluid
      @input="emit('update:modelValue', typeof $event.value === 'number' ? $event.value : null)"
      @update:model-value="emit('update:modelValue', $event ?? null)"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
