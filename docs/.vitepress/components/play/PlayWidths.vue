<script setup lang="ts">
import LucideIcon from '../landing/LucideIcon.vue';
import { type WidthId, widths } from './play-state';
import { roving } from './roving';

defineProps<{ width: WidthId }>();
const emit = defineEmits<{ choose: [id: WidthId] }>();
</script>

<template>
  <div class="play-seg play-seg--icons" role="radiogroup" aria-label="Width" @keydown="roving">
    <button
      v-for="entry in widths"
      :key="entry.id"
      type="button"
      role="radio"
      :aria-checked="entry.id === width"
      :tabindex="entry.id === width ? 0 : -1"
      :aria-label="entry.label"
      :title="entry.label"
      @click="emit('choose', entry.id)"
    >
      <LucideIcon :name="entry.icon" />
    </button>
  </div>
</template>
