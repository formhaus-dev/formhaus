<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { validateDefinition, type FormDefinition } from '@formhaus/core';
import seed from '../../../recipes/definitions/onboarding.json';
import LandingBuilder from './LandingBuilder.vue';
import LandingFlow from './LandingFlow.vue';
import LandingJson from './LandingJson.vue';
import LucideIcon from './LucideIcon.vue';
import { useHistory } from './builder-history';
import { toDefinition } from './builder-model';
import { fromDefinition } from './builder-parse';
import { buildGraph, nextStep } from './flow-graph';
import { flowState } from './flow-state';
import { formatJson } from './json-format';

const LandingDemoForm = defineAsyncComponent(() => import('./LandingDemoForm.vue'));

const tabs = [
  { id: 'write', label: 'Write' },
  { id: 'json', label: 'JSON' },
  { id: 'preview', label: 'Preview' },
] as const;
type Tab = (typeof tabs)[number]['id'];

const model = reactive(fromDefinition(seed as FormDefinition));
const history = useHistory(model);
const definition = computed(() => toDefinition(model));
const source = computed(() => formatJson(definition.value));
const problems = computed(() => safeValidate(definition.value));
const issues = computed(() => problems.value.length);
const liveVersion = ref(0);
const live = shallowRef(definition.value);
const graph = computed(() => buildGraph(live.value));
const tab = ref<Tab>('write');
onMounted(() => { if (window.matchMedia('(max-width: 767px)').matches) tab.value = 'preview'; });
const edited = ref(false);
const run = ref(0);
const first = () => live.value.steps?.[0]?.id ?? 'form';
const path = ref<string[]>([]);
const history_ = ref<string[]>([first()]);
const values = ref<Record<string, unknown>>({});
const done = ref(false);
const jsonError = ref('');

function safeValidate(value: FormDefinition): string[] {
  try {
    return validateDefinition(value);
  } catch (error) {
    return [error instanceof Error ? error.message : 'Invalid definition'];
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
watch(definition, (next) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const ids = new Set((next.steps ?? []).map((step) => step.id));
    const keep: string[] = [];
    for (const id of history_.value) {
      if (!ids.has(id)) break;
      keep.push(id);
    }
    live.value = next;
    liveVersion.value += 1;
    path.value = keep.length > 1 && keep[0] === first() ? keep : [];
    history_.value = [first()];
    done.value = false;
  }, 120);
});

const state = computed(() => flowState({ definition: live.value, graph: graph.value, history: history_.value, values: values.value, done: done.value }));
const progress = computed(() => {
  const route: string[] = [];
  for (let id: string | undefined = first(); id && !route.includes(id); id = nextStep(live.value, id, values.value)) route.push(id);
  const at = route.indexOf(history_.value[history_.value.length - 1]);
  return route.length > 1 ? `Step ${Math.max(1, at + 1)} of ${route.length}` : 'One page';
});

function onStep(id: string) {
  const index = history_.value.indexOf(id);
  history_.value = index >= 0 ? history_.value.slice(0, index + 1) : [...history_.value, id];
}

function restart() {
  values.value = {};
  path.value = [];
  history_.value = [first()];
  done.value = false;
  run.value += 1;
}

function reset() {
  history.replace(fromDefinition(seed as FormDefinition));
  jsonError.value = '';
  edited.value = false;
  restart();
}

let jsonTimer: ReturnType<typeof setTimeout> | undefined;
function onJson(text: string) {
  clearTimeout(jsonTimer);
  jsonTimer = setTimeout(() => applyJson(text), 300);
}

function applyJson(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    const at = /position (\d+)/.exec(message);
    const line = at ? text.slice(0, Number(at[1])).split('\n').length : undefined;
    jsonError.value = `${line ? `Line ${line}: ` : ''}${message.replace(/ in JSON.*$/, '').replace(/^JSON\.parse: /, '')}`;
    return;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return void (jsonError.value = 'Expected an object with "fields" or "steps"');
  const problems = safeValidate(parsed as FormDefinition);
  if (problems.length) return void (jsonError.value = problems[0]);
  jsonError.value = '';
  edited.value = true;
  history.replace(fromDefinition(parsed as FormDefinition));
}

onBeforeUnmount(() => {
  clearTimeout(timer);
  clearTimeout(jsonTimer);
});

function onSandboxKey(event: KeyboardEvent) {
  if ((event.target as HTMLElement).closest('.cm-editor')) return;
  history.onKey(event);
}

function onTabKey(event: KeyboardEvent) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  const visible = tabs.filter((item) => getComputedStyle(document.getElementById(`sandbox-tab-${item.id}`)!).display !== 'none');
  const index = visible.findIndex((item) => item.id === tab.value);
  const next = visible[(index + (event.key === 'ArrowRight' ? 1 : -1) + visible.length) % visible.length];
  tab.value = next.id;
  document.getElementById(`sandbox-tab-${next.id}`)?.focus();
}
</script>

<template>
  <section class="lp-section" aria-labelledby="demo-title">
    <p class="lp-eyebrow">Live demo</p>
    <h2 id="demo-title" class="lp-title">Write it like a doc</h2>
    <p class="lp-lead">Type the questions. The form, the flow and the JSON follow.</p>
    <div class="sandbox" :data-tab="tab" @keydown="onSandboxKey">
      <div class="sandbox__bar sandbox__bar--left">
        <span class="sandbox__dots" aria-hidden="true"><i /><i /><i /></span>
        <div class="sandbox__tabs" role="tablist" aria-label="Demo view" @keydown="onTabKey">
          <button
            v-for="item in tabs"
            :id="`sandbox-tab-${item.id}`"
            :key="item.id"
            type="button"
            role="tab"
            class="sandbox__tab"
            :data-tab="item.id"
            :aria-selected="tab === item.id"
            :aria-controls="`sandbox-${item.id}`"
            :tabindex="tab === item.id ? 0 : -1"
            @click="tab = item.id"
          >
            {{ item.label }}
          </button>
        </div>
        <span v-if="issues" class="sandbox__issues" role="status" :title="problems.join('\n')">{{ issues }} {{ issues === 1 ? 'issue' : 'issues' }}</span>
        <div class="sandbox__actions">
          <button type="button" class="sandbox__icon" title="Undo ⌘Z" aria-label="Undo" :disabled="!history.canUndo.value" @click="history.undo()"><LucideIcon name="undo" /></button>
          <button type="button" class="sandbox__icon" title="Redo ⇧⌘Z" aria-label="Redo" :disabled="!history.canRedo.value" @click="history.redo()"><LucideIcon name="redo" /></button>
          <button type="button" class="sandbox__text" title="Reset to example" @click="reset"><LucideIcon name="restart" /> Reset</button>
        </div>
      </div>
      <div class="sandbox__bar sandbox__bar--right">
        <span class="sandbox__label">Preview</span>
        <span class="sandbox__muted">{{ progress }}</span>
        <button type="button" class="sandbox__restart" @click="restart"><LucideIcon name="restart" /> Restart</button>
      </div>
      <div id="sandbox-write" class="sandbox__pane sandbox__pane--write" role="tabpanel" aria-labelledby="sandbox-tab-write">
        <LandingBuilder :form="model" :edited="edited" @edit="edited = true" />
      </div>
      <div id="sandbox-json" class="sandbox__pane sandbox__pane--json" role="tabpanel" aria-labelledby="sandbox-tab-json">
        <LandingJson :source="source" :error="jsonError" :active="tab === 'json'" @change="onJson" />
      </div>
      <div class="sandbox__graph"><LandingFlow :graph="graph" :state="state" /></div>
      <div id="sandbox-preview" class="sandbox__pane sandbox__pane--preview" role="tabpanel" aria-labelledby="sandbox-tab-preview">
        <div class="sandbox__preview">
          <ClientOnly>
            <LandingDemoForm
              :key="`${run}-${liveVersion}`"
              :definition="live"
              :initial="values"
              :path="path"
              @step="onStep"
              @values="(next) => (values = next)"
              @done="(value) => (done = value)"
            />
          </ClientOnly>
        </div>
      </div>
    </div>
    <p class="sandbox__caption">The editor is available on desktop.</p>
  </section>
</template>

<style scoped src="./sandbox.css"></style>
<style scoped src="./sandbox-panes.css"></style>
