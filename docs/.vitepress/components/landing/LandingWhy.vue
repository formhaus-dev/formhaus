<script setup lang="ts">
import LandingSection from './LandingSection.vue';

const points = [
  {
    title: 'Versioned like code',
    text: 'The definition lives in your repo. Formhaus Cloud keeps every published version.',
  },
  {
    title: 'Runs in your bundle',
    text: 'The React and Vue renderers ship with your app. Rendering needs no Formhaus service.',
  },
  {
    title: 'Open format',
    text: 'The definition follows a public spec. Any tool can read or write it.',
  },
];
</script>

<template>
  <LandingSection id="why" eyebrow="Why Formhaus" title="The form stays yours.">
    <ul class="why lp-grid lp-grid--3">
      <li v-for="point in points" :key="point.title" class="lp-card">
        <h3>{{ point.title }}</h3>
        <p>{{ point.text }}</p>
      </li>
    </ul>
  </LandingSection>
</template>

<style scoped>
.why {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
