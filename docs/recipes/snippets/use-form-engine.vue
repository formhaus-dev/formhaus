<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { useFormEngine } from '@formhaus/vue';

const props = defineProps<{ definition: FormDefinition; send: (values: Record<string, unknown>) => Promise<void> }>();
const { engine, visibleFields, values, errors, isFirstStep, isLastStep } = useFormEngine(() => props.definition);

function input(key: string, event: Event) {
  engine.setValue(key, (event.target as HTMLInputElement).value);
}
</script>

<template>
  <form @submit.prevent="engine.submit(props.send)">
    <label v-for="field in visibleFields" :key="field.key">
      {{ field.label }}
      <input :value="values[field.key] ?? ''" @input="input(field.key, $event)" />
      {{ errors[field.key] }}
    </label>
    <button v-if="!isFirstStep" type="button" @click="engine.back()">Back</button>
    <button v-if="isLastStep" type="submit">Send</button>
    <button v-else type="button" @click="engine.next()">Next</button>
  </form>
</template>
