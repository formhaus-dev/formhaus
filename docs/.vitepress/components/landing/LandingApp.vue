<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import type { FormDefinition } from '@formhaus/core';
import template from '../../../../templates/contact-form.json';
import LandingFrame from './LandingFrame.vue';
import LandingSection from './LandingSection.vue';
import { handRolled, highlight, panes } from './app-code';

const LandingDemoForm = defineAsyncComponent(() => import('./LandingDemoForm.vue'));

const definition = template.definition as FormDefinition;
const views = panes.map((pane) => {
  const shown = pane.source.split('\n').length;
  const total = pane.id === 'hand' ? handRolled.total : shown;
  return { ...pane, total, lines: highlight(pane.source), more: total - shown };
});
const activeId = ref(views[0].id);
const active = computed(() => views.find((item) => item.id === activeId.value) ?? views[0]);

watch(activeId, (id) => {
  document.getElementById(`app-tab-${id}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});

function onKey(event: KeyboardEvent) {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  const next = views[(views.indexOf(active.value) + step + views.length) % views.length];
  activeId.value = next.id;
  document.getElementById(`app-tab-${next.id}`)?.focus();
}
</script>

<template>
  <LandingSection
    id="app"
    title="Use your own components"
    lead="Build forms in React or Vue with your design system."
  >
    <LandingFrame class="app">
      <template #bar>
        <div class="app__tabs" role="tablist" aria-label="Code sample" @keydown="onKey">
          <button
            v-for="view in views"
            :id="`app-tab-${view.id}`"
            :key="view.id"
            type="button"
            role="tab"
            class="app__tab"
            aria-controls="app-code"
            :aria-selected="view.id === activeId"
            :tabindex="view.id === activeId ? 0 : -1"
            @click="activeId = view.id"
          ><span :class="{ app__long: 'short' in view }">{{ view.label }}</span><span v-if="'short' in view" class="app__short">{{ view.short }}</span><span v-if="'count' in view" class="app__count">{{ view.count }}</span></button>
        </div>
      </template>
      <div id="app-code" class="app__code" role="tabpanel" :aria-labelledby="`app-tab-${active.id}`" tabindex="0">
        <p class="app__file">{{ active.file }} · {{ active.total }} lines</p>
        <pre :key="active.id" class="app__pre"><code><span
          v-for="(line, index) in active.lines"
          :key="index"
          class="app__line"
          :style="{ '--i': index }"
        ><span class="app__num">{{ index + 1 }}</span><span
          v-for="(token, position) in line"
          :key="position"
          :class="`app__${token.kind}`"
        >{{ token.text }}</span></span></code></pre>
        <p v-if="active.more" class="app__more">+ {{ active.more }} more lines</p>
      </div>
      <template #aside-bar>
        <span class="app__label">Live form</span>
        <span class="app__muted">contact-form.json</span>
      </template>
      <template #aside>
        <div class="app__form">
          <ClientOnly>
            <LandingDemoForm :definition="definition" />
          </ClientOnly>
        </div>
      </template>
    </LandingFrame>
  </LandingSection>
</template>

<style scoped src="./app.css"></style>
<style scoped src="./app-code.css"></style>
