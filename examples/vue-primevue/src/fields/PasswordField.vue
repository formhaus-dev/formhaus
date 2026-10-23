<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import Password from 'primevue/password';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <Password
      :input-id="id"
      :name="field.key"
      :model-value="typeof modelValue === 'string' ? modelValue : ''"
      :placeholder="field.placeholder"
      :invalid="!!error"
      :input-props="{
        autocomplete: field.autocomplete,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy(id, field, error),
      }"
      :disabled="disabled || loading"
      :feedback="false"
      :data-testid="testId"
      toggle-mask
      fluid
      @update:model-value="emit('update:modelValue', $event ?? '')"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
