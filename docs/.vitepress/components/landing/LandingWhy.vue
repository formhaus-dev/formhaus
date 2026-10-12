<script setup lang="ts">
import LandingSection from './LandingSection.vue';

const points = [
  {
    title: 'Built by your agent',
    text: 'Claude Code, Cursor or any MCP client publishes the form from a prompt, edits it and reads the submissions.',
  },
  {
    title: 'Your JSON, your app',
    text: 'The form is a JSON file you keep in git. It renders natively in React or Vue, or as a hosted page and embed.',
  },
  {
    title: 'Open by default',
    text: 'An open format with a public spec. Every submission is yours over the REST API, by webhook or as CSV.',
  },
];
</script>

<template>
  <LandingSection id="why" eyebrow="Why Formhaus" title="The form stays yours." lead="JSON in git, native in your app, open endpoint and API.">
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
