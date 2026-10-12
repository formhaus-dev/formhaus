<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { computed, ref } from 'vue';
import EditorIsland from './EditorIsland.vue';

const definition = ref<FormDefinition | null>(null);
const copied = ref(false);
const json = computed(() => (definition.value ? `${JSON.stringify(definition.value, null, 2)}\n` : ''));

async function copy() {
  if (!json.value) return;
  await navigator.clipboard.writeText(json.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
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
        <p>Build a form, preview it and copy the JSON. Your draft stays in this browser.</p>
      </div>
      <div class="build-actions">
        <button type="button" class="build-button" :disabled="!definition" @click="copy">
          {{ copied ? 'Copied' : 'Copy JSON' }}
        </button>
        <button type="button" class="build-button" :disabled="!definition" @click="download">Download JSON</button>
      </div>
    </header>
    <ClientOnly>
      <EditorIsland storage="local" @change="definition = $event" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.build {
  max-width: 1104px;
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
}
</style>
