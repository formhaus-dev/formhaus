<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
</script>

<template>
  <LandingSection id="start" title="Make your first form">
    <div class="cloud-actions"><a class="lp-button" href="https://app.formhaus.dev/login">Start free</a></div>
    <nav class="developer-links" aria-label="Developer resources">
      <a href="/cloud/overview">Docs</a><span aria-hidden="true">·</span>
      <a href="/cloud/rest-api">API</a><span aria-hidden="true">·</span>
      <a href="https://github.com/ignsm/formhaus">GitHub</a>
    </nav>
  </LandingSection>
</template>

<style scoped>
.cloud-actions { margin-top: 0; }
.developer-links { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 64px; color: var(--vp-c-text-2); font-size: 13px; }
a { display: inline-flex; align-items: center; min-height: 44px; }
</style>
