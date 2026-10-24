<script setup lang="ts">
import { useData } from 'vitepress';
import LucideIcon from '../landing/LucideIcon.vue';
import PlayDesigns from './PlayDesigns.vue';
import { designGroups } from './play-state';

defineProps<{ presetId: string; sources: { id: string; label: string }[]; designId: string; copied: boolean }>();
const emit = defineEmits<{ preset: [id: string]; design: [id: string]; share: []; stackblitz: [] }>();
const { isDark } = useData();
const value = (event: Event) => (event.target as HTMLSelectElement).value;
</script>

<template>
  <header class="play-bar">
    <a class="play-logo" href="/" aria-label="Formhaus home">
      <img class="play-logo__light" :src="`/brand/logo-full.svg`" alt="Formhaus" width="112" height="24" />
      <img class="play-logo__dark" :src="`/brand/logo-full-dark.svg`" alt="" width="112" height="24" />
    </a>
    <span class="play-bar__title" aria-hidden="true">Playground</span>
    <label class="play-select">
      <span class="play-sr">Example</span>
      <select :value="presetId" @change="emit('preset', value($event))">
        <option v-for="preset in sources" :key="preset.id" :value="preset.id">{{ preset.label }}</option>
      </select>
      <LucideIcon name="chevron-down" />
    </label>
    <div class="play-bar__spacer" />
    <PlayDesigns :design-id="designId" @choose="emit('design', $event)" />
    <label class="play-select play-select--designs">
      <span class="play-sr">Design system</span>
      <select :value="designId" @change="emit('design', value($event))">
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
    <button type="button" class="play-button" @click="emit('share')">
      <LucideIcon :name="copied ? 'check' : 'link'" /><span>{{ copied ? 'Copied' : 'Share' }}</span>
    </button>
    <button type="button" class="play-button play-button--primary" @click="emit('stackblitz')">
      <LucideIcon name="external-link" /><span>StackBlitz</span>
    </button>
  </header>
</template>
