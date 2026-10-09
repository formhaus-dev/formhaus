<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LucideIcon from './LucideIcon.vue';
import { mountJsonEditor, type JsonEditorHandle } from './json-editor';
import { formatJson, tokenize } from './json-format';

const props = defineProps<{ source: string; error?: string; active: boolean }>();
const emit = defineEmits<{ change: [text: string] }>();

const host = ref<HTMLElement>();
const ready = ref(false);
const copied = ref(false);
const lines = computed(() => tokenize(props.source));
const count = computed(() => props.source.split('\n').length - 1);
let handle: JsonEditorHandle | undefined;
let pending = false;

function reformat(text: string): string | undefined {
  try {
    return formatJson(JSON.parse(text));
  } catch {
    return undefined;
  }
}

function sync() {
  if (!handle) return;
  if (handle.focused()) {
    pending = true;
    return;
  }
  pending = false;
  handle.setDoc(props.source);
}

onMounted(async () => {
  if (!host.value) return;
  handle = await mountJsonEditor(host.value, {
    doc: props.source,
    format: reformat,
    onChange: (text) => emit('change', text),
    onBlur: () => { if (pending) sync(); },
  });
  ready.value = true;
});

onBeforeUnmount(() => handle?.destroy());
watch(() => props.source, sync);

function format() {
  handle?.format();
}

async function copy() {
  try {
    await navigator.clipboard.writeText(handle?.text() ?? props.source);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <div class="json" :data-active="active">
    <div class="json__tools">
      <button type="button" class="json__btn" title="Format (Shift+Alt+F)" @click="format"><LucideIcon name="braces" /> Format</button>
      <button type="button" class="json__btn" aria-label="Copy JSON" @click="copy"><LucideIcon :name="copied ? 'check' : 'copy'" /> {{ copied ? 'Copied' : 'Copy' }}</button>
    </div>
    <div ref="host" class="json__editor" :hidden="!ready" />
    <pre v-if="!ready" class="json__pre" aria-label="Generated form definition"><code><span v-for="(line, index) in lines" :key="index" class="json__line"><span class="json__num">{{ index + 1 }}</span><span v-for="(token, position) in line" :key="position" :class="`json__${token.kind}`">{{ token.text }}</span></span></code></pre>
    <div class="json__status" role="status" :data-error="!!error">
      <span v-if="error"><LucideIcon name="x" /> {{ error }}</span>
      <span v-else><LucideIcon name="check" /> Valid definition · {{ count }} lines</span>
      <span class="json__status-right">JSON</span>
    </div>
  </div>
</template>

<style scoped>
.json {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vp-code-block-bg);
}

.json__tools {
  position: absolute;
  top: 10px;
  right: 14px;
  z-index: 2;
  display: flex;
  gap: 6px;
}

.json__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  opacity: 0.85;
  transition: opacity 0.12s, color 0.12s;
}

.json__btn:hover {
  color: var(--vp-c-text-1);
  opacity: 1;
}

.json__btn .lucide {
  width: 13px;
  height: 13px;
}

.json__editor,
.json__pre {
  flex: 1;
  min-height: 0;
}

.json__editor[hidden] {
  display: none;
}

.json__editor :deep(.cm-editor) {
  height: 100%;
}

.json__pre {
  margin: 0;
  padding: 12px 0 24px;
  overflow: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.json__pre code {
  padding: 0;
  font-size: inherit;
  color: inherit;
  background: none;
}

.json__line {
  display: block;
  padding-right: 16px;
}

.json__num {
  display: inline-block;
  width: 44px;
  padding: 0 10px 0 16px;
  box-sizing: border-box;
  text-align: right;
  color: var(--vp-code-line-number-color);
  user-select: none;
}

.json__key { color: var(--json-key); }
.json__string { color: var(--json-string); }
.json__literal { color: var(--json-number); }
.json__punct { color: var(--json-punct); }

.json__status {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 14px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
}

.json__status > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.json__status .lucide {
  width: 12px;
  height: 12px;
  color: var(--vp-c-green-1);
}

.json__status[data-error='true'] {
  color: var(--vp-c-danger-1);
}

.json__status[data-error='true'] .lucide {
  color: var(--vp-c-danger-1);
}

.json__status-right {
  flex: none;
  margin-left: auto;
  font-weight: 600;
  color: var(--vp-c-text-3);
}
</style>
