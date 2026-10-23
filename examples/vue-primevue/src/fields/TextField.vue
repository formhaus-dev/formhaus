<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import InputText from 'primevue/inputtext';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const types: Record<string, string> = { email: 'email', phone: 'tel' };
const type = computed(() => types[props.field.type] ?? 'text');
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <InputText
      :id="id"
      :name="field.key"
      :type="type"
      :model-value="typeof modelValue === 'string' ? modelValue : ''"
      :placeholder="field.placeholder"
      :inputmode="field.inputMode"
      :autocomplete="field.autocomplete"
      :invalid="!!error"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :data-testid="testId"
      fluid
      @update:model-value="emit('update:modelValue', $event ?? '')"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
