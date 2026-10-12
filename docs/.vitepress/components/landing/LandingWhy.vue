<script setup lang="ts">
const points = [
  {
    title: 'Built by your agent',
    text: 'Claude Code, Cursor or any MCP client publishes and edits the form from a prompt and reads the submissions.',
  },
  {
    title: 'Your JSON, your app',
    text: 'The form is a JSON file you keep in git. It renders natively in React or Vue, or as a hosted page and embed.',
  },
  {
    title: 'Open by default',
    text: 'Each form gets a submission endpoint, a REST API and CSV export, plus webhooks once claimed. The format and renderers are MIT licensed.',
  },
];
</script>

<template>
  <section class="lp-section why" aria-labelledby="why-title">
    <h2 id="why-title" class="lp-title">How it differs from Typeform, Google Forms and Tally</h2>
    <ul class="why__list">
      <li v-for="point in points" :key="point.title" class="lp-card why__item">
        <strong class="why__title">{{ point.title }}</strong>
        <span class="why__text">{{ point.text }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.vp-doc .why__list {
  display: grid;
  gap: 16px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.vp-doc .why__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 20px 24px;
}

.why__title {
  font-size: 16px;
  color: var(--vp-c-text-1);
}

.why__text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

@media (min-width: 768px) {
  .vp-doc .why__list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
