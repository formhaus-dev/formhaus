<script setup lang="ts">
import { useData } from 'vitepress';
import LucideIcon from '../landing/LucideIcon.vue';
import { takeEntryVisit } from './play-state';

const props = withDefaults(defineProps<{ copied: boolean; title?: string; home?: string }>(), {
  title: 'Playground',
  home: '/playground',
});
const emit = defineEmits<{ share: [] }>();
const { isDark } = useData();
const fromEntry = takeEntryVisit();
const back = (event: MouseEvent) => {
  if (!(fromEntry || document.referrer.startsWith(location.origin)) || history.length < 2) return;
  event.preventDefault();
  history.back();
};
</script>

<template>
  <header class="play-bar">
    <a class="play-button play-button--icon play-back vp-raw" :href="props.home" aria-label="Back" @click="back">
      <LucideIcon name="arrow-left" />
    </a>
    <a class="play-logo" href="/" aria-label="Formhaus home">
      <img class="play-logo__light" :src="`/brand/logo-full.svg`" alt="Formhaus" width="112" height="24" />
      <img class="play-logo__dark" :src="`/brand/logo-full-dark.svg`" alt="" width="112" height="24" />
    </a>
    <span class="play-bar__title" aria-hidden="true">{{ props.title }}</span>
    <slot />
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
    <slot name="actions" />
  </header>
</template>
