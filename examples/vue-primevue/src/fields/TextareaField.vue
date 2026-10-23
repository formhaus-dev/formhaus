<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import Textarea from 'primevue/textarea';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <Textarea
      :id="id"
      :name="field.key"
      :rows="field.rows ?? 4"
      :model-value="typeof modelValue === 'string' ? modelValue : ''"
      :placeholder="field.placeholder"
      :invalid="!!error"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :data-testid="testId"
      auto-resize
      fluid
      @update:model-value="emit('update:modelValue', $event ?? '')"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
