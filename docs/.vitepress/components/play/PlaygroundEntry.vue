<script setup lang="ts">
import './playground.css';
import './play-picker.css';
import { useData } from 'vitepress';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import PlayLive from './PlayLive.vue';
import PlayPicker from './PlayPicker.vue';
import { playForms } from './play-catalog';
import { shareParams } from './play-share';
import { designs, markEntryVisit } from './play-state';
import { roving } from './roving';
import { trackEdges } from './scroll-edges';

const { isDark } = useData();
const system = ref(designs[0]!.id);
const formKey = ref(playForms[0]!.key);
const strip = ref<HTMLElement>();
const stripWrap = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const stops: Array<() => void> = [];

const design = computed(() => designs.find((entry) => entry.id === system.value) ?? designs[0]!);
const form = computed(() => playForms.find((entry) => entry.key === formKey.value) ?? playForms[0]!);
const href = computed(() => `/play#${shareParams({ design: system.value, preset: form.value.preset, template: form.value.slug })}`);

function choose(id: string) {
  system.value = id;
  const box = strip.value;
  const tab = box?.querySelector<HTMLElement>(`#tab-${id}`);
  if (!box || !tab) return;
  const left = tab.offsetLeft - box.offsetLeft;
  if (left < box.scrollLeft || left + tab.offsetWidth > box.scrollLeft + box.clientWidth)
    box.scrollTo({ left: left - 16, behavior: 'smooth' });
}

onMounted(() => {
  if (strip.value && stripWrap.value) stops.push(trackEdges(strip.value, stripWrap.value, 'x'));
  const list = panel.value?.querySelector<HTMLElement>('.cb-list');
  if (list && panel.value) stops.push(trackEdges(list, panel.value, 'y'));
  const params = new URLSearchParams(location.search);
  const ds = params.get('ds');
  const key = params.get('f');
  if (designs.some((entry) => entry.id === ds)) choose(ds!);
  if (playForms.some((entry) => entry.key === key)) formKey.value = key!;
  watch([system, formKey], () => {
    const url = new URL(location.href);
    url.searchParams.set('ds', system.value);
    url.searchParams.set('f', formKey.value);
    history.replaceState(history.state, '', url);
  });
});

onBeforeUnmount(() => {
  for (const stop of stops) stop();
});
</script>

<template>
  <div class="ps">
    <header class="ps-head">
      <h1 class="ps-title">Playground</h1>
      <p class="ps-lead">One JSON form definition, rendered by {{ designs.length }} popular design systems.</p>
    </header>

    <div ref="stripWrap" class="ps-strip-wrap">
      <div ref="strip" class="ps-strip" role="tablist" aria-label="Design system" @keydown="roving">
        <button
          v-for="entry in designs"
          :id="`tab-${entry.id}`"
          :key="entry.id"
          type="button"
          role="tab"
          class="ps-tab"
          aria-controls="ps-preview"
          :aria-selected="entry.id === system"
          :tabindex="entry.id === system ? 0 : -1"
          @click="choose(entry.id)"
        >
          {{ entry.label }}
        </button>
      </div>
    </div>

    <div class="ps-stage">
      <div ref="panel" class="ps-panel"><PlayPicker v-model="formKey" inline /></div>
      <div class="ps-pick"><PlayPicker v-model="formKey" /></div>
      <div>
        <section id="ps-preview" class="lv-window" role="tabpanel" :aria-labelledby="`tab-${system}`">
          <div class="lv-bar">
            <span class="lv-bar__text">
              <span class="lv-bar__form">{{ form.title }}</span>
              <span class="lv-bar__system">{{ design.label }} · {{ design.framework }}</span>
              <span v-if="design.lightOnly && isDark" class="lv-bar__note">Light only</span>
            </span>
            <a class="lv-open" :href="href" @click="markEntryVisit">Open in the playground<LucideIcon name="arrow-right" /></a>
          </div>
          <PlayLive :system="system" :form="form" />
        </section>
        <div class="ps-open-under">
          <a class="lv-open lv-open--block" :href="href" @click="markEntryVisit">Open in the playground<LucideIcon name="arrow-right" /></a>
        </div>
      </div>
    </div>
  </div>
</template>
