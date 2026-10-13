<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
defineProps<{ showPricing?: boolean }>();
</script>

<template>
  <LandingSection id="start" title="Make your first form" lead="Share a link and start collecting responses.">
    <div class="cloud-actions"><a class="lp-button" href="https://app.formhaus.dev/login">Create a free form</a></div>
    <p v-if="showPricing" class="pricing-note"><a href="/pricing">Free for 3 forms. Pro is $19 a month.</a></p>
    <nav class="developer-links" aria-label="Developer resources">
      <a href="/cloud/overview">Docs</a><span aria-hidden="true">·</span>
      <a href="/cloud/rest-api">API</a><span aria-hidden="true">·</span>
      <a href="https://github.com/ignsm/formhaus">GitHub</a>
    </nav>
  </LandingSection>
</template>

<style scoped>
.cloud-actions { margin-top: 0; }
.pricing-note { margin: 12px 0 0; text-align: center; font-size: 14px; color: var(--vp-c-text-2); }
.pricing-note a:hover { color: var(--vp-c-brand-1); }
.developer-links { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 64px; color: var(--vp-c-text-2); font-size: 13px; }
a { display: inline-flex; align-items: center; min-height: 44px; }
</style>
