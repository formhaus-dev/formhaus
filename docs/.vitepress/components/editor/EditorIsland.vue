<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import './editor-tokens.css';

const props = defineProps<{ storage: 'local' | 'memory'; definition?: FormDefinition; lazy?: boolean }>();
const emit = defineEmits<{ change: [definition: FormDefinition]; ready: [] }>();

const root = ref<HTMLElement | null>(null);
const loaded = ref(false);
let unmount: (() => void) | null = null;
let observer: IntersectionObserver | null = null;
let disposed = false;

async function stylesheet(): Promise<void> {
  if (document.querySelector('style[data-fh-editor]')) return;
  const { default: css } = await import('@formhaus/editor-react/mount.css?inline');
  const style = Object.assign(document.createElement('style'), { textContent: css });
  style.dataset.fhEditor = '';
  document.head.append(style);
}

async function start() {
  observer?.disconnect();
  const [editor] = await Promise.all([import('@formhaus/editor-react/mount.js'), stylesheet()]);
  if (disposed || !root.value) return;
  const onChange = (definition: FormDefinition) => emit('change', definition);
  const host =
    props.storage === 'local'
      ? editor.createLocalHost({ onChange })
      : editor.createMemoryHost({ onChange, ...(props.definition ? { definition: props.definition } : {}) });
  if (props.storage === 'local') {
    const draft = editor.readLocalDraft(window.localStorage);
    if (draft) emit('change', draft.definition);
  }
  unmount = editor.mount(root.value, { host });
  loaded.value = true;
  emit('ready');
}

onMounted(() => {
  if (!props.lazy || !('IntersectionObserver' in window)) {
    void start();
    return;
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) void start();
  }, { rootMargin: '200px' });
  if (root.value) observer.observe(root.value);
});

onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  unmount?.();
});
</script>

<template>
  <div class="editor-island" :aria-busy="!loaded">
    <div ref="root" />
    <div v-if="!loaded" class="editor-island-placeholder">
      <div class="editor-island-bar" />
      <div class="editor-island-card" />
      <div class="editor-island-card" />
    </div>
  </div>
</template>

<style scoped>
.editor-island-placeholder {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-island-bar {
  height: 32px;
  width: 240px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
}

.editor-island-card {
  height: 132px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
</style>
