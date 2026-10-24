<script setup lang="ts">
import './play.css';
import './play-bar.css';
import './play-preview.css';
import './play-mobile.css';
import { useData } from 'vitepress';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import PlayBar from './PlayBar.vue';
import PlayCode from './PlayCode.vue';
import { useDefinition } from './definition';
import { mountJsonEditor, type JsonEditor } from './json-editor';
import { issueText, readHash, writeHash } from './play-share';
import { appUrl, type Code, codeUrl, designs, presets, stackblitz, type WidthId, widths } from './play-state';
import { usePreviews } from './previews';
import { roving } from './roving';

const designId = ref(designs[0]!.id);
const width = ref<WidthId>('desktop');
const view = ref<'preview' | 'code'>('preview');
const tab = ref<'json' | 'preview' | 'code'>('preview');
const codes = reactive(new Map<string, Code>());
const copied = ref(false);
const mobile = ref(false);
const editorHost = ref<HTMLElement>();
let editor: JsonEditor | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let hashTimer: ReturnType<typeof setTimeout> | undefined;
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const { isDark } = useData();
const form = useDefinition(
  () => editor,
  () => previews.send(designId.value),
);
const previews = usePreviews(form.definition, isDark);
const { text, presetId, sources, status, statusKind, listed } = form;

const design = computed(() => designs.find((entry) => entry.id === designId.value) ?? designs[0]!);
const outView = computed(() => (mobile.value ? (tab.value === 'code' ? 'code' : 'preview') : view.value));
const blocking = computed(() => form.errors.value || previews.issues.get(designId.value)?.length || 0);
const stale = computed(() => blocking.value > 0 && previews.rendered.has(designId.value));
const stageWidth = computed(() => (mobile.value ? 'desktop' : width.value));
const frameWidth = computed(() => widths.find((entry) => entry.id === stageWidth.value)?.px ?? 0);

const share = () => writeHash({ design: designId.value, width: width.value, ...form.shared() });

function scheduleHash() {
  clearTimeout(hashTimer);
  hashTimer = setTimeout(async () => history.replaceState(history.state, '', await share()), 400);
}

function onEdit(next: string) {
  text.value = next;
  clearTimeout(timer);
  timer = setTimeout(form.validate, 150);
  scheduleHash();
}

async function choosePreset(id: string) {
  await form.applyPreset(id);
  scheduleHash();
}

function chooseDesign(id: string) {
  designId.value = id;
  previews.loaded.add(id);
  previews.send(id);
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
  const next = (await (await fetch(codeUrl(design.value))).json()) as Code;
  codes.set(id, next);
  return next;
}

function showCode() {
  view.value = 'code';
  loadCode();
}

async function copyLink() {
  history.replaceState(history.state, '', await share());
  await navigator.clipboard.writeText(location.href);
  copied.value = true;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1600);
}

async function openStackblitz() {
  stackblitz(await loadCode(), text.value, form.formTitle.value);
}

function jump(issue: (typeof listed.value)[number]) {
  form.jump(issue);
  if (mobile.value) tab.value = 'json';
}

watch(tab, (next) => next === 'code' && loadCode());

async function restore() {
  const shared = await readHash(location.hash);
  if (shared.design && designs.some((entry) => entry.id === shared.design)) designId.value = shared.design;
  if (shared.width && widths.some((entry) => entry.id === shared.width)) width.value = shared.width as WidthId;
  previews.loaded.add(designId.value);
  await form.loadTemplate(shared.template);
  await form.applyPreset(form.template.value?.id ?? shared.preset ?? presets[0]!.id, shared.text);
  if (outView.value === 'code') loadCode();
}

onMounted(async () => {
  const media = window.matchMedia('(max-width: 860px)');
  mobile.value = media.matches;
  media.addEventListener('change', (event) => (mobile.value = event.matches));
  window.addEventListener('hashchange', restore);
  await restore();
  await nextTick();
  if (editorHost.value) editor = await mountJsonEditor(editorHost.value, text.value, onEdit);
  form.validate();
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', restore);
  editor?.destroy();
});
</script>

<template>
  <div class="play" :data-tab="tab">
    <PlayBar
      :preset-id="presetId"
      :sources="sources"
      :design-id="designId"
      :copied="copied"
      @preset="choosePreset"
      @design="chooseDesign"
      @share="copyLink"
      @stackblitz="openStackblitz"
    />

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
          <div class="play-seg play-seg--view" role="tablist" aria-label="View" @keydown="roving">
            <button type="button" role="tab" :aria-selected="view === 'preview'" :tabindex="view === 'preview' ? 0 : -1" @click="view = 'preview'">
              Preview
            </button>
            <button type="button" role="tab" :aria-selected="view === 'code'" :tabindex="view === 'code' ? 0 : -1" @click="showCode">Code</button>
          </div>
          <span class="play-pane__label">
            {{ design.label }} <span class="play-pane__muted">· {{ design.framework }}</span>
            <span v-if="design.lightOnly && isDark" class="play-note" title="This design system has no dark mode">Light only</span>
          </span>
          <div v-if="outView === 'preview'" class="play-seg play-seg--icons" role="radiogroup" aria-label="Width" @keydown="roving">
            <button
              v-for="entry in widths"
              :key="entry.id"
              type="button"
              role="radio"
              :aria-checked="entry.id === width"
              :tabindex="entry.id === width ? 0 : -1"
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
                v-if="previews.loaded.has(entry.id)"
                v-show="entry.id === designId"
                :ref="(element) => previews.bind(entry.id, element)"
                :src="appUrl(entry)"
                :title="`${entry.label} preview`"
                class="play-frame"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                :class="{ 'play-frame--waiting': !previews.rendered.has(entry.id) }"
              />
            </template>
            <div v-if="!previews.rendered.has(designId)" class="play-loading" :data-kind="blocking ? 'error' : 'loading'">
              <template v-if="blocking">
                <LucideIcon name="circle-alert" />Fix {{ blocking }} {{ blocking === 1 ? 'error' : 'errors' }} to see the preview
              </template>
              <template v-else>Loading {{ design.label }}</template>
            </div>
          </div>
        </div>

        <PlayCode v-if="outView === 'code'" :key="designId" :code="codes.get(designId)" :dir="design.dir" />
      </section>
    </main>
  </div>
</template>
