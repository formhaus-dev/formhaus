<script setup lang="ts">
import LandingActions from './LandingActions.vue';
import LandingSection from './LandingSection.vue';
import McpCommand from './McpCommand.vue';

const repo = 'https://github.com/ignsm/formhaus';
const links = [
  { text: 'GitHub', href: repo },
  { text: 'npm', href: 'https://www.npmjs.com/package/@formhaus/core' },
  { text: 'Recipes', href: '/recipes/' },
  { text: 'Changelog', href: '/changelog' },
];
</script>

<template>
  <LandingSection id="start" eyebrow="Get started" title="Publish your first form.">
    <div class="closing">
      <LandingActions />
      <McpCommand id="closing-mcp" />
    </div>
    <nav class="closing__footer" aria-label="Project links">
      <a v-for="link in links" :key="link.text" :href="link.href" v-bind="link.href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {}">{{ link.text }}</a>
    </nav>
  </LandingSection>
</template>

<style scoped>
.closing {
  display: grid;
  gap: 32px;
  max-width: 564px;
}

.closing__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 13px;
  line-height: 20px;
  color: var(--vp-c-text-2);
}

.closing__footer a {
  font-weight: 500;
  text-decoration: none;
  color: var(--vp-c-text-1);
}

.closing__footer a:hover {
  color: var(--vp-c-brand-1);
}
</style>
