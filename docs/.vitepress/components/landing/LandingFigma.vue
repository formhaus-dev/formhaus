<script setup lang="ts">
import LucideIcon from './LucideIcon.vue';

const points = ['Your own components', 'Flow map for every branch', 'Clickable prototype', 'AI drafts from a text prompt'];
</script>

<template>
  <section class="lp-section" aria-labelledby="figma-title">
    <div class="figma">
      <div class="figma__text">
        <p class="lp-eyebrow">Figma plugin</p>
        <h2 id="figma-title" class="lp-title">Designers see the real form</h2>
        <p class="lp-lead">Mockups, flow map and prototype from the same JSON.</p>
        <ul class="figma__points">
          <li v-for="point in points" :key="point">{{ point }}</li>
        </ul>
        <a class="lp-more" href="/guide/figma">Figma plugin guide <LucideIcon name="arrow-right" /></a>
      </div>
      <img
        v-for="theme in ['light', 'dark']"
        :key="theme"
        :class="['figma__image', `figma__image--${theme}`]"
        :src="theme === 'dark' ? '/figma/flow-map-dark.png' : '/figma/flow-map.png'"
        width="1952"
        height="964"
        loading="lazy"
        decoding="async"
        alt="A branching account form laid out in Figma as a flow map with labelled arrows"
      />
    </div>
  </section>
</template>

<style scoped>
.figma {
  display: grid;
  gap: 40px;
  align-items: center;
}

.figma__text {
  min-width: 0;
}

.vp-doc .figma__points {
  display: grid;
  gap: 14px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.vp-doc .figma__points li {
  position: relative;
  margin: 0;
  padding-left: 22px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.vp-doc .figma__points li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--vp-c-brand-2);
}

.figma__image {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(91, 63, 176, 0.14);
}

.figma__image--dark,
html.dark .figma__image--light {
  display: none;
}

html.dark .figma__image--dark {
  display: block;
}

@media (min-width: 960px) {
  .figma {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 64px;
  }
}
</style>
