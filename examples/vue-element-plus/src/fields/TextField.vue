<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElInput } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const types: Record<string, string> = { email: 'email', phone: 'tel', password: 'password', textarea: 'textarea' };
const type = computed(() => types[props.field.type] ?? 'text');
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <ElInput
      :id="id"
      :name="field.key"
      :type="type"
      :model-value="typeof modelValue === 'string' ? modelValue : ''"
      :placeholder="field.placeholder"
      :rows="field.rows ?? 4"
      :autosize="type === 'textarea' ? { minRows: field.rows ?? 3 } : undefined"
      :inputmode="field.inputMode"
      :autocomplete="field.autocomplete ?? (type === 'password' ? 'off' : undefined)"
      :show-password="type === 'password'"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :validate-event="false"
      :data-testid="testId"
      @update:model-value="emit('update:modelValue', $event)"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
