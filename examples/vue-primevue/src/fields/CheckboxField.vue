<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import Checkbox from 'primevue/checkbox';
import ToggleSwitch from 'primevue/toggleswitch';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const control = computed(() => (props.field.type === 'switch' ? ToggleSwitch : Checkbox));
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error" kind="inline">
    <component
      :is="control"
      :input-id="id"
      :name="field.key"
      :model-value="modelValue === true"
      :binary="field.type === 'checkbox' || undefined"
      :invalid="!!error"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :data-testid="testId"
      @update:model-value="emit('update:modelValue', $event === true)"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
