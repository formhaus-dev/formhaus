<script setup lang="ts">
import LandingFrame from './LandingFrame.vue';
import LandingSection from './LandingSection.vue';
</script>

<template>
  <LandingSection id="figma" title="See your form in Figma">
    <template #lead>One JSON file powers your app, hosted form and <a href="/guide/figma">Figma mockups</a>.</template>
    <LandingFrame class="figma" fixed>
      <template #bar>
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
  </LandingSection>
</template>

<style scoped>
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
