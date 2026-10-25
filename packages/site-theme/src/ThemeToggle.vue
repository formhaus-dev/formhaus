<script setup lang="ts">
import { useData } from 'vitepress';

const { isDark } = useData();
</script>

<template>
  <button type="button" class="fh-theme" role="switch" :aria-checked="isDark" aria-label="Dark theme" @click="isDark = !isDark">
    <svg class="fh-theme__icon fh-theme__icon--moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
    <svg class="fh-theme__icon fh-theme__icon--sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  </button>
</template>

<style scoped>
.fh-theme {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: color 0.25s;
}

.fh-theme__icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}


@media (hover: hover) and (pointer: fine) {
  .fh-theme:hover {
    color: var(--vp-c-brand-1);
  }
}

.fh-theme:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}
</style>

<style>
.fh-theme__icon--moon,
.dark .fh-theme__icon--sun {
  display: none;
}

.dark .fh-theme__icon--moon {
  display: block;
}
</style>
