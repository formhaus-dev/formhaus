<script setup lang="ts">
import LucideIcon from '../landing/LucideIcon.vue';
import { roving } from '../play/roving';
import { type LibraryId, libraries, type Recipe, supports } from './recipes';

const props = defineProps<{ recipe: Recipe; library: LibraryId }>();
const emit = defineEmits<{ choose: [id: string] }>();

const unsupported = (id: LibraryId) =>
  typeof props.recipe.snippets === 'string'
    ? 'This recipe uses no schema library'
    : supports(props.recipe, id)
      ? undefined
      : `This recipe has no ${libraries.find((entry) => entry.id === id)?.label} version`;
const pick = (id: string) => libraries.some((entry) => entry.id === id && !unsupported(entry.id)) && emit('choose', id);
</script>

<template>
  <div class="play-seg play-seg--designs" role="radiogroup" aria-label="Schema library" @keydown="roving">
    <button
      v-for="entry in libraries"
      :key="entry.id"
      type="button"
      role="radio"
      :aria-checked="entry.id === library"
      :tabindex="entry.id === library ? 0 : -1"
      :disabled="Boolean(unsupported(entry.id))"
      :title="unsupported(entry.id)"
      @click="pick(entry.id)"
    >
      {{ entry.label }}
    </button>
  </div>
  <label class="play-select play-select--designs">
    <span class="play-sr">Schema library</span>
    <select :value="library" :disabled="typeof recipe.snippets === 'string'" @change="pick(($event.target as HTMLSelectElement).value)">
      <option v-for="entry in libraries" :key="entry.id" :value="entry.id" :disabled="Boolean(unsupported(entry.id))">{{ entry.label }}</option>
    </select>
    <LucideIcon name="chevron-down" />
  </label>
</template>
