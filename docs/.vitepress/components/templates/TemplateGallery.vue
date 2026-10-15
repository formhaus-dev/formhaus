<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';
import { track } from '@formhaus/site-theme';
import index from '../../../../templates/index.json';
import LucideIcon from '../landing/LucideIcon.vue';
import { categories, categoryLabel, counts, type TemplateEntry } from './catalog';
import './templates.css';

const templates = index as TemplateEntry[];
const active = ref('all');
const firstIndex = (category: string) => templates.findIndex((template) => template.category === category);
const chips = computed(() => [
  { id: 'all', label: 'All', count: templates.length },
  ...categories
    .map((category) => ({ ...category, count: templates.filter((template) => template.category === category.id).length }))
    .filter((category) => category.count > 0)
    .sort((a, b) => firstIndex(a.id) - firstIndex(b.id)),
]);
const visible = computed(() => (active.value === 'all' ? templates : templates.filter((template) => template.category === active.value)));

onMounted(() => {
  const category = new URL(location.href).searchParams.get('category');
  if (category && chips.value.some((chip) => chip.id === category)) active.value = category;
});

function choose(id: string) {
  active.value = id;
  track('template_filter', { category: id });
  const url = new URL(location.href);
  if (id === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', id);
  history.replaceState(history.state, '', url);
}
</script>

<template>
  <div class="tpl-gallery">
    <header class="tpl-gallery__header">
      <h1 class="tpl-gallery__title">Form templates</h1>
      <p class="tpl-gallery__lead">
        {{ templates.length }} ready-to-use form definitions. Try each one live, open it in Formhaus Cloud, or copy the JSON into your React or Vue app.
      </p>
    </header>
    <div class="tpl-chips" role="group" aria-label="Filter by category">
      <button
        v-for="chip in chips"
        :key="chip.id"
        type="button"
        class="tpl-chip"
        :aria-pressed="active === chip.id"
        @click="choose(chip.id)"
      >
        {{ chip.label }} <span class="tpl-chip__count">{{ chip.count }}</span>
      </button>
    </div>
    <ul class="tpl-grid">
      <li v-for="template in visible" :key="template.slug">
        <a class="tpl-card" :href="withBase(`/templates/${template.slug}`)">
          <span class="tpl-card__category">{{ categoryLabel(template.category) }}</span>
          <h2 class="tpl-card__title">{{ template.title }}</h2>
          <span class="tpl-card__summary">{{ template.summary }}</span>
          <span class="tpl-card__meta">{{ counts(template) }} <LucideIcon name="arrow-right" /></span>
        </a>
      </li>
    </ul>
  </div>
</template>
