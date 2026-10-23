<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElInputNumber } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <ElInputNumber
      :id="id"
      :name="field.key"
      :model-value="typeof modelValue === 'number' ? modelValue : null"
      :placeholder="field.placeholder"
      :value-on-clear="null"
      controls-position="right"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :validate-event="false"
      :data-testid="testId"
      class="field__control"
      @update:model-value="emit('update:modelValue', typeof $event === 'number' ? $event : null)"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
