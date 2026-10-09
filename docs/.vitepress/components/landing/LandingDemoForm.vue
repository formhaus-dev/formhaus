<script setup lang="ts">
import { nextTick, onMounted, provide, ref } from 'vue';
import { FormRenderer } from '@formhaus/vue';
import type { FormDefinition } from '@formhaus/core';
import DemoActions from './DemoActions.vue';
import LucideIcon from './LucideIcon.vue';
import './demo-form.css';
import './demo-actions.css';

const props = defineProps<{ definition: FormDefinition; initial?: Record<string, unknown>; path?: string[] }>();
const emit = defineEmits<{
  step: [id: string];
  values: [values: Record<string, unknown>];
  done: [value: boolean];
}>();

const payload = ref<Record<string, unknown>>();
const result = ref<HTMLElement>();
const root = ref<HTMLElement>();
const advance = ref(0);
let remaining = 0;
let advancing = false;
provide('demo-advance', advance);

onMounted(() => {
  remaining = (props.path?.length ?? 1) - 1;
  if (remaining <= 0) return;
  advancing = true;
  advance.value += 1;
});

function finish() {
  remaining = 0;
  setTimeout(() => { advancing = false; }, 80);
}

function onFocusIn(event: FocusEvent) {
  if (!advancing) return;
  const from = event.relatedTarget as HTMLElement | null;
  if (from && !root.value?.contains(from)) from.focus({ preventScroll: true });
  else if (!from) (event.target as HTMLElement).blur();
}

function onStep(id: string) {
  emit('step', id);
  if (remaining <= 0) return;
  remaining -= 1;
  const expected = props.path?.[props.path.length - 1 - remaining];
  if (id !== expected || remaining === 0) finish();
  else advance.value += 1;
}

async function onSubmit(values: Record<string, unknown>) {
  payload.value = values;
  emit('done', true);
  await nextTick();
  result.value?.focus();
}
</script>

<template>
  <div ref="root" class="demo-form" @focusin="onFocusIn">
    <div v-if="payload" ref="result" class="demo-form__result" tabindex="-1">
      <span class="demo-form__badge"><LucideIcon name="check" /></span>
      <p class="demo-form__heading">Submitted</p>
      <pre class="demo-form__payload"><code>{{ JSON.stringify(payload, null, 2) }}</code></pre>
    </div>
    <FormRenderer
      v-else
      :definition="props.definition"
      :initial-values="props.initial"
      :actions-component="DemoActions"
      @step-change="onStep"
      @field-change="(_key, _value, values) => emit('values', { ...values })"
      @submit="onSubmit"
    />
  </div>
</template>
