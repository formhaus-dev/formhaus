<script setup lang="ts">
import { computed } from 'vue';
import { fieldComponentProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);
const current = computed(() => String(props.modelValue ?? ''));
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <select
      v-bind="input"
      class="fh-field__input fh-field__input--select"
      :value="current"
      @change="(e) => emit('update:modelValue', (e.target as HTMLSelectElement).value)"
    >
      <option v-if="props.field.placeholder" value="" disabled :selected="current === ''">
        {{ props.field.placeholder }}
      </option>
      <option v-for="(option, index) in (props.field.options ?? [])" :key="String(option.value)" :value="option.value" :selected="String(option.value) === current">
        {{ option.label }}
      </option>
    </select>
  </FieldShell>
</template>
