<script setup lang="ts">
import type { FormDefinition, FormEvent, FormRendererHandle } from '@formhaus/core';
import { FormRenderer } from '@formhaus/vue';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{ definition: FormDefinition; send: (values: Record<string, unknown>) => Promise<void> }>();
const route = useRoute();
const router = useRouter();
const form = ref<FormRendererHandle | null>(null);
const notice = ref('');
let syncing = true;

const stepInUrl = () => (typeof route.query.step === 'string' ? route.query.step : '');

function open() {
  const requested = stepInUrl() || props.definition.steps?.[0]?.id;
  if (!form.value || !requested) return;
  syncing = true;
  const result = form.value.goToStep(requested);
  syncing = false;
  notice.value = result.reached ? '' : 'That step is not available yet. Finish this one first.';
  if (!result.reached && result.stepId) void router.replace({ query: { ...route.query, step: result.stepId } });
}

function onFormEvent(event: FormEvent) {
  if (event.type !== 'step_viewed' || syncing || stepInUrl() === event.stepId) return;
  notice.value = '';
  void router.push({ query: { ...route.query, step: event.stepId } });
}

onMounted(() => {
  open();
  syncing = false;
});
watch(() => route.query.step, open);
</script>

<template>
  <p v-if="notice" role="status">{{ notice }}</p>
  <FormRenderer ref="form" :definition="props.definition" :on-submit="props.send" @form-event="onFormEvent" />
</template>
