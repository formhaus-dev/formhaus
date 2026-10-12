<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { withBase } from 'vitepress';
import index from '../../../../templates/index.json';
import { categoryLabel, type TemplateEntry } from '../templates/catalog';
import LucideIcon from './LucideIcon.vue';

const templates = index as TemplateEntry[];
const uid = useId();
const query = ref('');
const section = ref<HTMLElement>();
const needle = computed(() => query.value.trim().toLowerCase());
const shown = computed(() =>
  templates.filter((template) =>
    [template.title, template.summary, categoryLabel(template.category)].some((text) => text.toLowerCase().includes(needle.value)),
  ),
);
const status = computed(() => {
  if (!shown.value.length) return `No templates match “${query.value.trim()}”`;
  return `${shown.value.length} ${shown.value.length === 1 ? 'template' : 'templates'}`;
});

function onKey(event: KeyboardEvent) {
  const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
  if (!step || !section.value) return;
  const items = [...section.value.querySelectorAll<HTMLElement>('input, a')];
  const next = items[items.indexOf(document.activeElement as HTMLElement) + step];
  if (!next) return;
  event.preventDefault();
  next.focus();
}
</script>

<template>
  <div class="ob-start">
    <p class="ob-start__lead">Start from scratch or pick a template. You can change every field later.</p>
    <a class="ob-start__blank" :href="withBase('/build?new=1')">
      <span class="ob-start__icon"><LucideIcon name="file-plus" /></span>
      <span class="ob-start__body">
        <span class="ob-start__name">Blank form</span>
        <span class="ob-start__text">Add fields and steps in the visual editor, then publish.</span>
      </span>
      <LucideIcon name="arrow-right" class="ob-start__arrow" />
    </a>
    <section ref="section" class="ob-start__templates" :aria-labelledby="`${uid}-title`" @keydown="onKey">
      <h3 :id="`${uid}-title`" class="ob-start__heading">Templates</h3>
      <label class="ob-start__search">
        <LucideIcon name="search" />
        <input :value="query" type="search" placeholder="Search templates" aria-label="Search templates" autocomplete="off" @input="query = ($event.target as HTMLInputElement).value" />
      </label>
      <p class="lp-sr-only" role="status">{{ status }}</p>
      <ul v-if="shown.length" class="ob-start__list" :aria-labelledby="`${uid}-title`">
        <li v-for="template in shown" :key="template.slug">
          <a class="ob-start__item" :href="withBase(`/build?template=${template.slug}`)">
            <span class="ob-start__title">{{ template.title }}</span>
            <span class="ob-start__meta">{{ categoryLabel(template.category) }}</span>
          </a>
        </li>
      </ul>
      <div v-else class="ob-start__empty">
        <p>{{ status }}</p>
        <button type="button" class="ob-start__reset" @click="query = ''">Show all templates</button>
      </div>
    </section>
  </div>
</template>

<style scoped src="./onboarding-start.css"></style>
