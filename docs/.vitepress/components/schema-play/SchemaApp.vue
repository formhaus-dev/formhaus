<script setup lang="ts">
import '../play/play.css';
import '../play/play-bar.css';
import '../play/play-preview.css';
import '../play/play-mobile.css';
import './schema-play.css';
import type { FormDefinition } from '@formhaus/core';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import { useDefinition } from '../play/definition';
import { type Editor, mountEditor } from '../play/editor';
import PlayBar from '../play/PlayBar.vue';
import PlaySkeleton from '../play/PlaySkeleton.vue';
import PlayWidths from '../play/PlayWidths.vue';
import { issueText, readHash, writeHash } from '../play/play-share';
import { type WidthId, widths } from '../play/play-state';
import { roving } from '../play/roving';
import TemplatePreview from '../templates/TemplatePreview.vue';
import { definitionOf, type LibraryId, libraries, recipeOf, recipes, snippetOf, supports } from './recipes';
import SchemaLibraries from './SchemaLibraries.vue';
import SchemaResult from './SchemaResult.vue';
import { useSchema } from './use-schema';

type Tab = 'schema' | 'json' | 'preview';
const tabs: { id: Tab; label: string }[] = [
  { id: 'schema', label: 'Schema' },
  { id: 'json', label: 'JSON' },
  { id: 'preview', label: 'Preview' },
];

const recipe = shallowRef(recipes[0]!);
const library = ref<LibraryId>('zod');
const file = ref<'schema' | 'json'>('schema');
const tab = ref<Tab>('preview');
const width = ref<WidthId>('desktop');
const mobile = ref(false);
const copied = ref(false);
const shown = shallowRef<FormDefinition>();
const version = ref(0);
const codeHost = ref<HTMLElement>();
const jsonHost = ref<HTMLElement>();
const drafts = new Map<string, string>();
let snippet = '';
let codeEditor: Editor | null = null;
let jsonEditor: Editor | null = null;
let timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};

const schema = useSchema(() => codeEditor);
const form = useDefinition(
  () => jsonEditor,
  () => {
    if (form.errors.value || JSON.stringify(form.definition.value) === JSON.stringify(shown.value)) return;
    shown.value = form.definition.value as FormDefinition;
    version.value += 1;
  },
  recipes.map((entry) => ({ id: entry.id, load: async () => definitionOf(entry) })),
);

const stale = computed(() => form.errors.value > 0 && Boolean(shown.value));
const frameWidth = computed(() => (mobile.value ? 0 : (widths.find((entry) => entry.id === width.value)?.px ?? 0)));
const status = computed(() =>
  file.value === 'schema'
    ? { text: schema.status.value, kind: schema.statusKind.value }
    : { text: form.status.value, kind: form.statusKind.value },
);

const draftKey = () => `${recipe.value.id}:${library.value}`;
const value = (event: Event) => (event.target as HTMLSelectElement).value;

function later(name: string, run: () => void, delay: number) {
  clearTimeout(timers[name]);
  timers[name] = setTimeout(run, delay);
}

const share = () =>
  writeHash({
    preset: recipe.value.id,
    library: library.value,
    text: form.shared().text,
    code: schema.code.value === snippet ? undefined : schema.code.value,
  });
const scheduleHash = () => later('hash', async () => history.replaceState(history.state, '', await share()), 400);

async function loadCode(text?: string) {
  snippet = snippetOf(recipe.value, library.value);
  schema.code.value = text ?? drafts.get(draftKey()) ?? snippet;
  codeEditor?.setDoc(schema.code.value);
  await schema.apply();
}

function onCode(next: string) {
  schema.code.value = next;
  drafts.set(draftKey(), next);
  later('code', schema.apply, 300);
  scheduleHash();
}

function onJson(next: string) {
  form.text.value = next;
  later('json', form.validate, 150);
  scheduleHash();
}

async function chooseRecipe(id: string) {
  recipe.value = recipeOf(id);
  if (!supports(recipe.value, library.value)) library.value = libraries.find((entry) => supports(recipe.value, entry.id))!.id;
  await Promise.all([form.applyPreset(recipe.value.id), loadCode()]);
  scheduleHash();
}

async function chooseLibrary(id: string) {
  library.value = id as LibraryId;
  await loadCode();
  scheduleHash();
}

async function copyLink() {
  history.replaceState(history.state, '', await share());
  await navigator.clipboard.writeText(location.href);
  copied.value = true;
  later('copy', () => (copied.value = false), 1600);
}

function jump(index: number) {
  if (file.value === 'schema') schema.jump();
  else form.jump(form.listed.value[index]!);
}

const issues = computed(() =>
  file.value === 'schema'
    ? schema.problem.value
      ? [
          {
            message: schema.problem.value.message,
            path: schema.problem.value.line ? `line ${schema.problem.value.line}` : '',
            severity: 'error',
          },
        ]
      : []
    : form.listed.value.map((issue) => ({ ...issue, message: issueText(issue.message) })),
);

watch(tab, (next) => {
  if (next !== 'preview') file.value = next;
});

async function restore() {
  const shared = await readHash(location.hash);
  recipe.value = recipeOf(shared.preset);
  const wanted = libraries.find((entry) => entry.id === shared.library && supports(recipe.value, entry.id));
  library.value = (wanted ?? libraries.find((entry) => supports(recipe.value, entry.id))!).id;
  if (shared.code) drafts.set(draftKey(), shared.code);
  await Promise.all([form.applyPreset(recipe.value.id, shared.text), loadCode(shared.code)]);
  version.value += 1;
}

onMounted(async () => {
  const media = window.matchMedia('(max-width: 860px)');
  mobile.value = media.matches;
  media.addEventListener('change', (event) => (mobile.value = event.matches));
  window.addEventListener('hashchange', restore);
  if (codeHost.value) codeEditor = await mountEditor(codeHost.value, '', onCode, 'typescript');
  if (jsonHost.value) jsonEditor = await mountEditor(jsonHost.value, '', onJson);
  await restore();
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', restore);
  for (const timer of Object.values(timers)) clearTimeout(timer);
  timers = {};
  codeEditor?.destroy();
  jsonEditor?.destroy();
  schema.destroy();
});
</script>

<template>
  <div class="play sp" :data-tab="tab === 'preview' ? 'preview' : 'json'">
    <PlayBar :copied="copied" title="Schema playground" home="/guide/schema-validation" @share="copyLink">
      <label class="play-select">
        <span class="play-sr">Recipe</span>
        <select :value="recipe.id" @change="chooseRecipe(value($event))">
          <option v-for="entry in recipes" :key="entry.id" :value="entry.id">{{ entry.label }}</option>
        </select>
        <LucideIcon name="chevron-down" />
      </label>
      <div class="play-bar__spacer" />
      <SchemaLibraries :recipe="recipe" :library="library" @choose="chooseLibrary" />
    </PlayBar>

    <nav class="play-tabs" aria-label="Panels">
      <button v-for="entry in tabs" :key="entry.id" type="button" :aria-pressed="tab === entry.id" @click="tab = entry.id">{{ entry.label }}</button>
    </nav>

    <main class="play-main">
      <section class="play-pane play-pane--json" aria-label="Editor">
        <div class="play-pane__head">
          <div class="play-seg play-seg--view" role="tablist" aria-label="File" @keydown="roving">
            <button type="button" role="tab" :aria-selected="file === 'schema'" :tabindex="file === 'schema' ? 0 : -1" @click="file = 'schema'">schema.ts</button>
            <button type="button" role="tab" :aria-selected="file === 'json'" :tabindex="file === 'json' ? 0 : -1" @click="file = 'json'">definition.json</button>
          </div>
          <span class="play-status sp-status" :data-kind="status.kind">{{ status.text }}</span>
        </div>
        <div v-show="file === 'schema'" ref="codeHost" class="play-editor" />
        <div v-show="file === 'json'" ref="jsonHost" class="play-editor" />
        <ul v-if="issues.length" class="play-issues">
          <li v-for="(issue, index) in issues" :key="index" :data-kind="issue.severity">
            <button type="button" @click="jump(index)">
              <LucideIcon name="circle-alert" />
              <span class="play-issues__text">{{ issue.message }}</span>
              <code v-if="issue.path" class="play-issues__path">{{ issue.path }}</code>
            </button>
          </li>
        </ul>
      </section>

      <section class="play-pane play-pane--out" aria-label="Preview">
        <div class="play-pane__head">
          <span class="play-pane__label">Default <span class="play-pane__muted">· Vue</span></span>
          <PlayWidths :width="width" @choose="width = $event" />
        </div>
        <div class="play-stage" :data-width="mobile ? 'desktop' : width">
          <p v-if="stale" class="play-stale" role="status">
            <LucideIcon name="circle-alert" />
            Fix {{ form.errors.value }} {{ form.errors.value === 1 ? 'error' : 'errors' }} to update. Showing the last valid form.
          </p>
          <div class="play-device" :style="frameWidth ? { width: `${frameWidth}px` } : undefined">
            <div v-if="shown" class="sp-form">
              <TemplatePreview :key="`${version}:${recipe.id}`" :definition="shown" :on-validate="schema.validate" />
            </div>
            <PlaySkeleton v-else label="Loading the form" />
          </div>
        </div>
        <SchemaResult :run="schema.last.value" :problem="schema.problem.value" />
      </section>
    </main>
  </div>
</template>
