<script setup lang="ts">
import LucideIcon from '../landing/LucideIcon.vue';
import { templateGroups, templateId } from './play-catalog';
import { designGroups, presets } from './play-state';
import PlayDesigns from './PlayDesigns.vue';

defineProps<{ presetId: string; designId: string }>();
const emit = defineEmits<{ preset: [id: string]; design: [id: string] }>();
const value = (event: Event) => (event.target as HTMLSelectElement).value;
</script>

<template>
  <label class="play-select">
    <span class="play-sr">Example</span>
    <select :value="presetId" @change="emit('preset', value($event))">
      <optgroup label="Examples">
        <option v-for="preset in presets" :key="preset.id" :value="preset.id">{{ preset.label }}</option>
      </optgroup>
      <optgroup v-for="group in templateGroups" :key="group.id" :label="group.label">
        <option v-for="entry in group.entries" :key="entry.slug" :value="templateId(entry.slug)">{{ entry.title }}</option>
      </optgroup>
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
</template>
