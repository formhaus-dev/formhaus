<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
</script>

<template>
  <fieldset :id="f.id" data-fh="field" v-bind="f.aria">
    <legend>{{ f.label }}</legend>
    <button
      v-for="option in f.options"
      :key="option.value"
      type="button"
      :aria-pressed="f.value === option.value"
      :disabled="f.disabled"
      @click="f.commit(option.value)"
    >
      {{ option.label }}
    </button>
    <p v-if="f.error" :id="f.errorId">{{ f.error }}</p>
  </fieldset>
</template>
