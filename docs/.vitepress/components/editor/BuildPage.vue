<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { computed, onMounted, ref } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import BuildReplace from './BuildReplace.vue';
import { conflicts, hasStart, requestedStart, starter, takeCarried, type Start } from './build-start';
import EditorIsland from './EditorIsland.vue';
import { launch } from './launch';

const initial = ref<FormDefinition>(starter);
const ready = ref(false);
const pending = ref<Start | null>(null);
const draftTitle = ref('');
let clear = () => {};
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

onMounted(async () => {
  const carried = takeCarried();
  if (carried && !hasStart(location.search)) {
    const editor = await import('@formhaus/editor-react/mount.js');
    if (!conflicts(editor.readLocalDraft(window.localStorage)?.definition, carried)) window.localStorage.removeItem(editor.LOCAL_KEY);
    editor.carryToBuild(carried);
  }
  if (!hasStart(location.search)) {
    ready.value = true;
    return;
  }
  const [next, editor] = await Promise.all([requestedStart(location.search), import('@formhaus/editor-react/mount.js')]);
  history.replaceState(history.state, '', location.pathname + location.hash);
  const draft = editor.readLocalDraft(window.localStorage)?.definition;
  clear = () => window.localStorage.removeItem(editor.LOCAL_KEY);
  pending.value = next;
  if (next && conflicts(draft, next.definition)) draftTitle.value = draft.title || 'Untitled form';
  else choose(true);
});

function choose(replace: boolean) {
  if (replace && pending.value) {
    clear();
    initial.value = pending.value.definition;
  }
  draftTitle.value = '';
  ready.value = true;
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
      <BuildReplace v-if="draftTitle && pending" :draft="draftTitle" :next="pending.label" @keep="choose(false)" @replace="choose(true)" />
      <EditorIsland v-else-if="ready" storage="local" :definition="initial" saved-hint="Saved in this browser" @change="definition = $event" />
    </ClientOnly>
  </div>
</template>

<style scoped src="./build-page.css"></style>
