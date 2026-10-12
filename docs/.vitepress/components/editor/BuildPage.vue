<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { computed, ref } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
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
          Build a form, preview it, then launch it on Formhaus Cloud or copy the JSON for <a href="/guide/#formhaus-react">React</a>,
          <a href="/guide/#formhaus-vue">Vue</a> or <a href="/guide/#install">any framework</a>. Your draft stays in this browser.
        </p>
      </div>
      <div class="build-actions">
        <button type="button" class="build-button" :disabled="!definition" @click="copy">
          {{ copied ? 'Copied' : 'Copy JSON' }}
        </button>
        <button type="button" class="build-button" :disabled="!definition" @click="download">Download JSON</button>
        <button
          type="button"
          class="build-button build-primary"
          title="Opens Formhaus Cloud. Sign in with an email link to keep the form."
          :disabled="!definition || launching"
          @click="start"
        >
          {{ launching ? 'Opening Cloud…' : 'Launch for free' }}
        </button>
      </div>
      <p v-if="failure" class="build-failure" role="alert"><LucideIcon name="circle-alert" />{{ failure }}</p>
    </header>
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
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 32px;
  margin-bottom: 24px;
}

.build-title h1 {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
}

.build-title p {
  max-width: 60ch;
  margin: 4px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 20px;
}

.build-title {
  flex: 1 1 auto;
  min-width: 0;
}

.build-actions {
  display: flex;
  flex: none;
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
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  gap: 6px;
  z-index: 20;
  max-width: 420px;
  margin: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-danger-1);
  font-size: 13px;
  line-height: 18px;
}

.build-failure :deep(svg) {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 1px;
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

  .build-failure {
    position: static;
    max-width: none;
    margin-top: -8px;
  }
}
</style>
