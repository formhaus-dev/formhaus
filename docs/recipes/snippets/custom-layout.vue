<script setup lang="ts">
import { errorSummary, type FormDefinition, type SubmitHandler } from '@formhaus/core';
import { useFormEngine } from '@formhaus/vue';
import { computed, nextTick } from 'vue';

const props = defineProps<{ definition: FormDefinition; send: SubmitHandler }>();
const { engine, visibleFields, values, errors, topLevelErrors, isLastStep } = useFormEngine(() => props.definition);
const summary = computed(() => {
  void [values.value, errors.value, topLevelErrors.value];
  return errorSummary(engine, { idPrefix: 'signup' });
});

function input(key: string, event: Event) {
  engine.setValue(key, (event.target as HTMLInputElement).value);
}

async function showField(key: string, id: string) {
  engine.goToStepWithField(key);
  await nextTick();
  document.getElementById(id)?.focus();
}
</script>

<template>
  <form @submit.prevent="engine.submit(props.send)">
    <label v-for="field in visibleFields" :key="field.key">
      {{ field.label }}
      <input :id="`signup-${field.key}`" :aria-invalid="!!errors[field.key]" :value="values[field.key] ?? ''" @input="input(field.key, $event)" />
    </label>
    <p v-for="error in summary.topLevelErrors" :key="error" role="alert">{{ error }}</p>
    <nav v-if="summary.count > 0" :aria-label="`${summary.count} errors`">
      <ul v-for="group in summary.groups" :key="group.id" :aria-label="group.title">
        <li v-for="entry in group.entries" :key="entry.key">
          <a :href="`#${entry.id}`" @click.prevent="showField(entry.key, entry.id)">{{ entry.text }}</a>
        </li>
      </ul>
    </nav>
    <button v-if="isLastStep" type="submit">Send</button>
    <button v-else type="button" @click="engine.next()">Next</button>
  </form>
</template>
