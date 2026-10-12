<script setup lang="ts">
import LandingFrame from './LandingFrame.vue';
import LandingSection from './LandingSection.vue';
import LucideIcon from './LucideIcon.vue';
</script>

<template>
  <LandingSection
    id="figma"
    eyebrow="Figma plugin"
    title="Designers see the real form."
    lead="Paste the definition into the plugin: mockups in your own components, a flow map of every branch, a clickable prototype."
  >
    <LandingFrame class="figma" fixed>
      <template #bar>
        <svg class="figma__logo" viewBox="0 0 38 57" width="10" height="15" aria-hidden="true">
          <path fill="currentColor" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0zM0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0zM19 0v19h9.5a9.5 9.5 0 1 0 0-19H19zM0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5zM0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
        </svg>
        <span class="figma__file">Account form</span>
        <span class="figma__page">Flow map</span>
        <span class="figma__zoom">Formhaus plugin</span>
      </template>
      <div class="figma__canvas">
        <img
          v-for="theme in ['light', 'dark']"
          :key="theme"
          :class="['figma__image', `figma__image--${theme}`]"
          :src="theme === 'dark' ? '/figma/flow-map-frame-dark.webp' : '/figma/flow-map-frame.webp'"
          width="1742"
          height="752"
          loading="lazy"
          decoding="async"
          alt="A branching account form laid out in Figma as a flow map with labelled arrows"
        />
      </div>
    </LandingFrame>
    <div class="lp-links">
      <a class="lp-link" href="/guide/figma">Figma plugin guide <LucideIcon name="arrow-right" /></a>
    </div>
  </LandingSection>
</template>

<style scoped>
.figma__logo {
  flex: none;
  color: var(--vp-c-text-2);
}

.figma__file {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.figma__page {
  color: var(--vp-c-text-2);
}

.figma__page::before {
  content: '/';
  margin-right: 12px;
  color: var(--vp-c-text-3);
}

.figma__zoom {
  margin-left: auto;
  color: var(--vp-c-text-3);
}

.figma__canvas {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 32px;
  background: var(--vp-c-bg-soft);
}

.figma__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.figma__image--dark,
html.dark .figma__image--light {
  display: none;
}

html.dark .figma__image--dark {
  display: block;
}

@media (max-width: 767px) {
  .figma__canvas {
    padding: 16px;
  }
}
</style>
