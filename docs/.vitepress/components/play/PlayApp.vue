<script setup lang="ts">
import { checkDefinition, type DefinitionIssue } from '@formhaus/core';
import { useData } from 'vitepress';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import { mountJsonEditor, type JsonEditor } from './json-editor';
import {
  appUrl,
  type Code,
  codeUrl,
  designGroups,
  designs,
  issueMarks,
  issueText,
  presets,
  readHash,
  stackblitz,
  syntaxError,
  type JsonError,
  type WidthId,
  widths,
  writeHash,
} from './play-state';
import './play.css';

type Issue = Pick<DefinitionIssue, 'path' | 'message' | 'severity'>;

const designId = ref(designs[0]!.id);
const width = ref<WidthId>('desktop');
const view = ref<'preview' | 'code'>('preview');
const tab = ref<'json' | 'preview' | 'code'>('preview');
const presetId = ref(presets[0]!.id);
const text = ref('');
const parseError = ref<JsonError | null>(null);
const issues = ref<Issue[]>([]);
const definition = shallowRef<object | null>(null);
const loaded = reactive(new Set<string>());
const ready = reactive(new Set<string>());
const rendered = reactive(new Set<string>());
const previewIssues = reactive(new Map<string, Issue[]>());
const codes = reactive(new Map<string, Code>());
const fileIndex = ref(0);
const copied = ref<'' | 'code' | 'link'>('');
const mobile = ref(false);
const editorHost = ref<HTMLElement>();
const frames = new Map<string, HTMLIFrameElement>();
const sent = new Map<string, string>();
let editor: JsonEditor | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let hashTimer: ReturnType<typeof setTimeout> | undefined;
let copyTimer: ReturnType<typeof setTimeout> | undefined;
let media: MediaQueryList | undefined;
let presetText = '';

const design = computed(() => designs.find((entry) => entry.id === designId.value) ?? designs[0]!);
const inlineDesigns = designs.filter((entry) => entry.inline);
const moreOpen = ref(false);
const moreRoot = ref<HTMLElement>();

function closeMore(event: Event) {
  if (event instanceof KeyboardEvent ? event.key === 'Escape' : !moreRoot.value?.contains(event.target as Node)) moreOpen.value = false;
}

function pickMore(id: string) {
  moreOpen.value = false;
  chooseDesign(id);
}
const errors = computed(() => (parseError.value ? 1 : issues.value.filter((issue) => issue.severity === 'error').length));
const warnings = computed(() => issues.value.filter((issue) => issue.severity === 'warning').length);
const outView = computed(() => (mobile.value ? (tab.value === 'code' ? 'code' : 'preview') : view.value));
const code = computed(() => codes.get(designId.value));
const file = computed(() => code.value?.files[fileIndex.value]);
const blocking = computed(() => errors.value || previewIssues.get(designId.value)?.length || 0);
const stale = computed(() => blocking.value > 0 && rendered.has(designId.value));
const stageWidth = computed(() => (mobile.value ? 'desktop' : width.value));
const frameWidth = computed(() => widths.find((entry) => entry.id === stageWidth.value)?.px ?? 0);
const formTitle = computed(() => {
  const value = definition.value as { title?: unknown } | null;
  return typeof value?.title === 'string' ? value.title : 'Formhaus form';
});
const status = computed(() => {
  if (parseError.value) return `JSON error on line ${parseError.value.line}`;
  if (errors.value) return `${errors.value} ${errors.value === 1 ? 'error' : 'errors'}`;
  if (warnings.value) return `${warnings.value} ${warnings.value === 1 ? 'warning' : 'warnings'}`;
  return 'Valid';
});
const statusKind = computed(() => (errors.value ? 'error' : warnings.value ? 'warning' : 'ok'));
const listed = computed<Issue[]>(() =>
  parseError.value ? [{ path: '', message: parseError.value.message, severity: 'error' }] : issues.value,
);

const { isDark } = useData();

function sendTheme(id: string) {
  frames.get(id)?.contentWindow?.postMessage({ type: 'formhaus:theme', theme: isDark.value ? 'dark' : 'light' }, location.origin);
}

function send(id: string) {
  const frame = frames.get(id);
  if (!frame?.contentWindow || !ready.has(id) || !definition.value) return;
  const payload = JSON.stringify(definition.value);
  if (sent.get(id) === payload) return;
  sent.set(id, payload);
  frame.contentWindow.postMessage({ type: 'formhaus:definition', definition: definition.value }, location.origin);
}

function validate() {
  const source = text.value;
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    parseError.value = syntaxError(source, error);
    issues.value = [];
    editor?.setMarks([
      { from: parseError.value.from, to: parseError.value.from + 1, message: parseError.value.message, severity: 'error' },
    ]);
    return;
  }
  parseError.value = null;
  issues.value = checkDefinition(value);
  editor?.setMarks(issueMarks(source, issues.value));
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    definition.value = value;
    send(designId.value);
  }
}

function share() {
  return writeHash({
    design: designId.value,
    width: width.value,
    preset: presetId.value,
    text: text.value === presetText ? undefined : text.value,
  });
}

function scheduleHash() {
  clearTimeout(hashTimer);
  hashTimer = setTimeout(async () => history.replaceState(history.state, '', await share()), 400);
}

function onEdit(next: string) {
  text.value = next;
  clearTimeout(timer);
  timer = setTimeout(validate, 150);
  scheduleHash();
}

async function applyPreset(id: string, source?: string) {
  const preset = presets.find((entry) => entry.id === id) ?? presets[0]!;
  presetId.value = preset.id;
  presetText = `${JSON.stringify(await preset.load(), null, 2)}\n`;
  text.value = source ?? presetText;
  editor?.setDoc(text.value);
  validate();
}

async function choosePreset(event: Event) {
  await applyPreset((event.target as HTMLSelectElement).value);
  scheduleHash();
}

function chooseDesign(id: string) {
  designId.value = id;
  fileIndex.value = 0;
  loaded.add(id);
  send(id);
  if (outView.value === 'code') loadCode();
  scheduleHash();
}

function chooseWidth(id: WidthId) {
  width.value = id;
  scheduleHash();
}

async function loadCode() {
  const id = designId.value;
  if (codes.has(id)) return codes.get(id)!;
  const response = await fetch(codeUrl(design.value));
  const next = (await response.json()) as Code;
  codes.set(id, next);
  return next;
}

function showCode() {
  view.value = 'code';
  loadCode();
}

function flash(kind: 'code' | 'link') {
  copied.value = kind;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = ''), 1600);
}

async function copyFile() {
  if (!file.value) return;
  await navigator.clipboard.writeText(file.value.source);
  flash('code');
}

async function copyLink() {
  const hash = await share();
  history.replaceState(history.state, '', hash);
  await navigator.clipboard.writeText(location.href);
  flash('link');
}

async function openStackblitz() {
  stackblitz(await loadCode(), text.value, formTitle.value);
}

function bindFrame(id: string, element: unknown) {
  if (element instanceof HTMLIFrameElement) frames.set(id, element);
}

function onMessage(event: MessageEvent) {
  if (event.origin !== location.origin) return;
  const id = [...frames].find(([, frame]) => frame.contentWindow === event.source)?.[0];
  if (!id) return;
  const data = event.data as { type?: string; issues?: Issue[] };
  if (data.type === 'formhaus:ready') {
    ready.add(id);
    sendTheme(id);
    send(id);
  } else if (data.type === 'formhaus:rendered') {
    previewIssues.delete(id);
    rendered.add(id);
  } else if (data.type === 'formhaus:error')
    previewIssues.set(
      id,
      (data.issues ?? []).map((issue) => ({ ...issue, severity: 'error' })),
    );
}

function jump(issue: Issue) {
  if (parseError.value) {
    editor?.select(parseError.value.from, parseError.value.from + 1);
    return;
  }
  const [mark] = issueMarks(text.value, [issue]);
  if (mark) editor?.select(mark.from, mark.to);
  if (mobile.value) tab.value = 'json';
}

watch(isDark, () => {
  for (const id of ready) sendTheme(id);
});

watch(tab, async (next) => {
  if (next === 'code') loadCode();
});

onMounted(async () => {
  document.addEventListener('pointerdown', closeMore);
  document.addEventListener('keydown', closeMore);
  media = window.matchMedia('(max-width: 860px)');
  mobile.value = media.matches;
  media.addEventListener('change', (event) => (mobile.value = event.matches));
  window.addEventListener('message', onMessage);
  const shared = await readHash(location.hash);
  if (shared.design && designs.some((entry) => entry.id === shared.design)) designId.value = shared.design;
  if (shared.width && widths.some((entry) => entry.id === shared.width)) width.value = shared.width as WidthId;
  loaded.add(designId.value);
  await applyPreset(shared.preset ?? presets[0]!.id, shared.text);
  await nextTick();
  if (editorHost.value) editor = await mountJsonEditor(editorHost.value, text.value, onEdit);
  validate();
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeMore);
  document.removeEventListener('keydown', closeMore);
  window.removeEventListener('message', onMessage);
  editor?.destroy();
});
</script>

<template>
  <div class="play" :data-tab="tab">
    <header class="play-bar">
      <a class="play-logo" href="/" aria-label="Formhaus home">
        <img class="play-logo__light" :src="`/brand/logo-full.svg`" alt="Formhaus" width="112" height="24" />
        <img class="play-logo__dark" :src="`/brand/logo-full-dark.svg`" alt="" width="112" height="24" />
      </a>
      <span class="play-bar__title">Playground</span>
      <label class="play-select">
        <span class="play-sr">Example</span>
        <select :value="presetId" @change="choosePreset">
          <option v-for="preset in presets" :key="preset.id" :value="preset.id">{{ preset.label }}</option>
        </select>
        <LucideIcon name="chevron-down" />
      </label>
      <div class="play-bar__spacer" />
      <div class="play-seg play-seg--designs" role="radiogroup" aria-label="Design system">
        <button
          v-for="entry in inlineDesigns"
          :key="entry.id"
          type="button"
          role="radio"
          :aria-checked="entry.id === designId"
          @click="chooseDesign(entry.id)"
        >
          {{ entry.label }}<span class="play-seg__tag">{{ entry.framework }}</span>
        </button>
        <div ref="moreRoot" class="play-more">
          <button
            type="button"
            class="play-more__toggle"
            aria-haspopup="menu"
            :aria-expanded="moreOpen"
            :data-active="!design.inline || undefined"
            @click="moreOpen = !moreOpen"
          >
            <template v-if="design.inline">More</template>
            <template v-else>{{ design.label }}<span class="play-seg__tag">{{ design.framework }}</span></template>
            <LucideIcon name="chevron-down" />
          </button>
          <div v-if="moreOpen" class="play-menu" role="menu" aria-label="More design systems">
            <template v-for="section in designGroups" :key="section.group">
              <p class="play-menu__group">{{ section.group }}</p>
              <button
                v-for="entry in section.entries"
                :key="entry.id"
                type="button"
                role="menuitemradio"
                :aria-checked="entry.id === designId"
                class="play-menu__item"
                @click="pickMore(entry.id)"
              >
                <span>{{ entry.label }}<span class="play-seg__tag">{{ entry.lightOnly ? 'Light only' : entry.framework }}</span></span>
                <LucideIcon v-if="entry.id === designId" name="check" />
              </button>
            </template>
          </div>
        </div>
      </div>
      <label class="play-select play-select--designs">
        <span class="play-sr">Design system</span>
        <select :value="designId" @change="chooseDesign(($event.target as HTMLSelectElement).value)">
          <optgroup v-for="section in designGroups" :key="section.group" :label="section.group">
            <option v-for="entry in section.entries" :key="entry.id" :value="entry.id">{{ entry.label }} · {{ entry.framework }}</option>
          </optgroup>
        </select>
        <LucideIcon name="chevron-down" />
      </label>
      <button
        type="button"
        class="play-button play-button--icon"
        :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        :title="isDark ? 'Light theme' : 'Dark theme'"
        @click="isDark = !isDark"
      >
        <LucideIcon :name="isDark ? 'sun' : 'moon'" />
      </button>
      <button type="button" class="play-button" @click="copyLink">
        <LucideIcon :name="copied === 'link' ? 'check' : 'link'" /><span>{{ copied === 'link' ? 'Copied' : 'Share' }}</span>
      </button>
      <button type="button" class="play-button play-button--primary" @click="openStackblitz">
        <LucideIcon name="external-link" /><span>StackBlitz</span>
      </button>
    </header>

    <nav class="play-tabs" aria-label="Panels">
      <button v-for="entry in ['json', 'preview', 'code'] as const" :key="entry" type="button" :aria-pressed="tab === entry" @click="tab = entry">
        {{ entry === 'json' ? 'JSON' : entry === 'preview' ? 'Preview' : 'Code' }}
      </button>
    </nav>

    <main class="play-main">
      <section class="play-pane play-pane--json" aria-label="Definition">
        <div class="play-pane__head">
          <span class="play-file">definition.json</span>
          <span class="play-status" :data-kind="statusKind">{{ status }}</span>
        </div>
        <div ref="editorHost" class="play-editor" />
        <ul v-if="listed.length" class="play-issues">
          <li v-for="(issue, index) in listed" :key="index" :data-kind="issue.severity">
            <button type="button" @click="jump(issue)">
              <LucideIcon name="circle-alert" />
              <span class="play-issues__text">{{ issueText(issue.message) }}</span>
              <code v-if="issue.path" class="play-issues__path">{{ issue.path }}</code>
            </button>
          </li>
        </ul>
      </section>

      <section class="play-pane play-pane--out" :aria-label="outView === 'code' ? 'Code' : 'Preview'">
        <div class="play-pane__head">
          <div class="play-seg play-seg--view" role="tablist" aria-label="View">
            <button type="button" role="tab" :aria-selected="view === 'preview'" @click="view = 'preview'">Preview</button>
            <button type="button" role="tab" :aria-selected="view === 'code'" @click="showCode">Code</button>
          </div>
          <span class="play-pane__label">
            {{ design.label }} <span class="play-pane__muted">· {{ design.framework }}</span>
            <span v-if="design.lightOnly && isDark" class="play-note" title="This design system has no dark mode">Light only</span>
          </span>
          <div v-if="outView === 'preview'" class="play-seg play-seg--icons" role="radiogroup" aria-label="Width">
            <button
              v-for="entry in widths"
              :key="entry.id"
              type="button"
              role="radio"
              :aria-checked="entry.id === width"
              :aria-label="entry.label"
              :title="entry.label"
              @click="chooseWidth(entry.id)"
            >
              <LucideIcon :name="entry.icon" />
            </button>
          </div>
        </div>

        <div v-show="outView === 'preview'" class="play-stage" :data-width="stageWidth">
          <p v-if="stale" class="play-stale" role="status">
            <LucideIcon name="circle-alert" />
            Fix {{ blocking }} {{ blocking === 1 ? 'error' : 'errors' }} to update. Showing the last valid form.
          </p>
          <div class="play-device" :class="{ 'play-device--light': design.lightOnly }" :style="frameWidth ? { width: `${frameWidth}px` } : undefined">
            <template v-for="entry in designs" :key="entry.id">
              <iframe
                v-if="loaded.has(entry.id)"
                v-show="entry.id === designId"
                :ref="(element) => bindFrame(entry.id, element)"
                :src="appUrl(entry)"
                :title="`${entry.label} preview`"
                class="play-frame"
                :class="{ 'play-frame--waiting': !rendered.has(entry.id) }"
              />
            </template>
            <div v-if="!rendered.has(designId)" class="play-loading" :data-kind="blocking ? 'error' : 'loading'">
              <template v-if="blocking">
                <LucideIcon name="circle-alert" />Fix {{ blocking }} {{ blocking === 1 ? 'error' : 'errors' }} to see the preview
              </template>
              <template v-else>Loading {{ design.label }}</template>
            </div>
          </div>
        </div>

        <div v-if="outView === 'code'" class="play-code">
          <div class="play-code__files" role="tablist" aria-label="Files">
            <button
              v-for="(entry, index) in code?.files ?? []"
              :key="entry.path"
              type="button"
              role="tab"
              :aria-selected="index === fileIndex"
              @click="fileIndex = index"
            >
              {{ entry.path.replace(/^src\//, '') }}
            </button>
          </div>
          <div class="play-code__body">
            <div class="play-code__meta">
              <span>examples/{{ code?.dir ?? design.dir }}/{{ file?.path }}</span>
              <button type="button" class="play-button play-button--small" :disabled="!file" @click="copyFile">
                <LucideIcon :name="copied === 'code' ? 'check' : 'copy'" />{{ copied === 'code' ? 'Copied' : 'Copy' }}
              </button>
            </div>
            <div v-if="file" class="play-code__src" v-html="file.html" />
            <p v-else class="play-loading play-loading--inline">Loading code</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
