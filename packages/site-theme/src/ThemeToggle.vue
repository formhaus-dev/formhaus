<script setup lang="ts">
import { useData } from 'vitepress';

const { isDark } = useData();
</script>

<template>
  <div class="fh-theme" role="radiogroup" aria-label="Theme">
    <button type="button" role="radio" :aria-checked="!isDark" @click="isDark = false">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      Light
    </button>
    <button type="button" role="radio" :aria-checked="isDark" @click="isDark = true">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
      Dark
    </button>
  </div>
</template>

<style scoped>
.fh-theme {
  display: flex;
  padding: 3px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--fh-site-space-5);
}

.fh-theme button {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--fh-site-space-1-5);
  height: 30px;
  padding: 0 var(--fh-site-space-3);
  border: 0;
  border-radius: var(--fh-site-space-4);
  background: transparent;
  font-size: var(--fh-site-font-size-xs);
  font-weight: 500;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

.fh-theme button::after {
  content: '';
  position: absolute;
  inset: -7px 0;
}

.fh-theme button[aria-checked='true'] {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.fh-theme svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (hover: hover) and (pointer: fine) {
  .fh-theme button:hover {
    color: var(--vp-c-text-1);
  }
}

.fh-theme button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .fh-theme button {
    transition: none;
  }
}
</style>
