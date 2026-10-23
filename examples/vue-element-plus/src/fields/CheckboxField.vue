<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElCheckbox } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error" kind="inline">
    <ElCheckbox
      :id="id"
      :name="field.key"
      :model-value="modelValue === true"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :validate-event="false"
      :data-testid="testId"
      @update:model-value="emit('update:modelValue', $event === true)"
      @blur="emit('blur')"
      @focus="emit('focus')"
    >
      {{ field.label }}
    </ElCheckbox>
  </FieldShell>
</template>
