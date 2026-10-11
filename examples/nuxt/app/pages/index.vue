<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import { definition, type SubmitResponse } from '~~/shared/definition';

const errors = ref<Record<string, string>>();
const saved = ref<Record<string, unknown> | null>(null);

async function submit(values: Record<string, unknown>, skippedSteps?: string[]) {
  const result = await $fetch<SubmitResponse>('/api/submit', {
    method: 'POST',
    body: { values, skippedSteps },
    ignoreResponseError: true,
  });
  if ('errors' in result) errors.value = result.errors;
  if ('values' in result) saved.value = result.values;
}
</script>

<template>
  <main>
    <h1>{{ definition.title }}</h1>
    <pre v-if="saved">{{ JSON.stringify(saved, null, 2) }}</pre>
    <FormRenderer v-else :definition="definition" :errors="errors" :submit-handler="submit" />
  </main>
</template>
