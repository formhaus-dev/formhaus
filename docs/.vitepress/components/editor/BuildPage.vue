<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { computed, ref } from 'vue';
import EditorIsland from './EditorIsland.vue';
import { launch } from './launch';

const starter: FormDefinition = {
  id: 'untitled-form',
  title: 'Untitled form',
  submit: { label: 'Submit' },
  fields: [{ key: 'email', type: 'email', label: 'Email' }],
};
const definition = ref<FormDefinition | null>(null);
const copied = ref(false);
const launching = ref(false);
const failure = ref('');
const json = computed(() => (definition.value ? `${JSON.stringify(definition.value, null, 2)}\n` : ''));

async function copy() {
  if (!json.value) return;
  await navigator.clipboard.writeText(json.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
}

async function start() {
  if (!definition.value || launching.value) return;
  launching.value = true;
  failure.value = '';
  try {
    window.location.assign(await launch(definition.value));
  } catch (error) {
    failure.value = error instanceof Error ? error.message : String(error);
    launching.value = false;
  }
}

function download() {
  if (!definition.value) return;
  const url = URL.createObjectURL(new Blob([json.value], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${definition.value.id || 'form'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="build">
    <header class="build-head">
      <div class="build-title">
        <h1>Form builder</h1>
        <p>
          Build a form, preview it and copy the JSON into <a href="/guide/#formhaus-react">React</a>, <a href="/guide/#formhaus-vue">Vue</a> or your agent. Your draft stays in
          this browser.
        </p>
      </div>
      <div class="build-actions">
        <button type="button" class="build-button" :disabled="!definition" @click="copy">
          {{ copied ? 'Copied' : 'Copy JSON' }}
        </button>
        <button type="button" class="build-button" :disabled="!definition" @click="download">Download JSON</button>
        <button type="button" class="build-button build-primary" :disabled="!definition || launching" @click="start">
          {{ launching ? 'Opening Cloud…' : 'Launch for free' }}
        </button>
      </div>
    </header>
    <p v-if="failure" class="build-failure" role="alert">{{ failure }}</p>
    <ClientOnly>
      <EditorIsland storage="local" :definition="starter" saved-hint="Saved in this browser" @change="definition = $event" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.build {
  max-width: 1216px;
  margin: 0 auto;
  padding: 32px 32px 96px;
}

.build-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.build-title h1 {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
}

.build-title p {
  margin: 4px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 20px;
}

.build-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.build-button {
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.build-button:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
}

.build-primary {
  border-color: var(--vp-c-brand-3);
  background: var(--vp-c-brand-3);
  color: var(--vp-c-white);
}

.build-primary:hover:not(:disabled) {
  border-color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-2);
}

.build-primary:disabled {
  border-color: var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}

.build-failure {
  margin: -8px 0 16px;
  color: var(--vp-c-danger-1);
  font-size: 14px;
  line-height: 20px;
}

.build-button:disabled {
  color: var(--vp-c-text-3);
  cursor: default;
}

@media (max-width: 640px) {
  .build {
    padding: 24px 16px 64px;
  }

  .build-head {
    flex-direction: column;
    align-items: stretch;
  }

  .build-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .build-primary {
    grid-column: 1 / -1;
    order: -1;
  }
}
</style>
