<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { useRouter } from 'vitepress';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { takeCarried } from './carry';
import { addRouteGuard, pathOf } from './routeGuard';
import './editor-tokens.css';

const props = defineProps<{ storage: 'local' | 'memory'; definition?: FormDefinition; lazy?: boolean; savedHint?: string; compact?: boolean }>();
const emit = defineEmits<{ change: [definition: FormDefinition]; ready: [] }>();

const root = ref<HTMLElement | null>(null);
const loaded = ref(false);
const router = useRouter();
let unmount: (() => void) | null = null;
let unguard: (() => void) | null = null;
let observer: IntersectionObserver | null = null;
let disposed = false;

const sheets = {
  editor: () => import('@formhaus/editor-react/mount.css?inline'),
  preview: () => import('@formhaus/editor-react/preview.css?inline'),
};

async function stylesheet(name: keyof typeof sheets): Promise<void> {
  if (document.querySelector(`style[data-fh-editor="${name}"]`)) return;
  const { default: css } = await sheets[name]();
  if (disposed) return;
  const style = Object.assign(document.createElement('style'), { textContent: css });
  style.dataset.fhEditor = name;
  document.head.append(style);
}

async function start() {
  observer?.disconnect();
  const [editor] = await Promise.all([
    import('@formhaus/editor-react/mount.js'),
    stylesheet('editor'),
    props.storage === 'local' ? stylesheet('preview') : null,
  ]);
  if (disposed || !root.value) return;
  const carried = props.storage === 'local' ? takeCarried() : null;
  if (carried) editor.carryToBuild(carried);
  const onChange = (definition: FormDefinition) => emit('change', definition);
  const options = { onChange, ...(props.definition ? { definition: props.definition } : {}), ...(props.savedHint ? { savedHint: props.savedHint } : {}) };
  const host = props.storage === 'local' ? editor.createLocalHost(options) : editor.createMemoryHost(options);
  const stored = props.storage === 'local' ? editor.readLocalDraft(window.localStorage)?.definition : undefined;
  const initial = stored ?? props.definition;
  if (initial) emit('change', initial);
  unmount = editor.mount(root.value, { host, compact: props.compact });
  unguard = addRouteGuard(router, (to) => pathOf(to) === pathOf(window.location.href) || editor.confirmLeave());
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
  unguard?.();
  unmount?.();
  if (props.storage === 'local') document.querySelector('style[data-fh-editor="preview"]')?.remove();
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
.editor-island :deep(:is(ul, ol)) {
  margin: 0;
  padding: 0;
  list-style: none;
}

.editor-island :deep(li + li) {
  margin-top: 0;
}

.editor-island :deep(:is(p, h1, h2, h3)) {
  margin: 0;
  line-height: inherit;
}

.editor-island :deep(:not(pre) > code) {
  padding: 0;
  background: none;
  color: inherit;
  font-size: inherit;
}

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
