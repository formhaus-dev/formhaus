<script setup lang="ts">
import LandingHeroVideo from '../landing/LandingHeroVideo.vue';
</script>

<template>
  <section class="cloud-hero lp-container" aria-labelledby="cloud-title">
    <header class="lp-head">
      <h1 id="cloud-title">Forms for your AI-built app</h1>
      <p class="lp-lead">Collect responses from your app, without setting up a backend.</p>
      <div class="cloud-actions">
        <a class="lp-button" href="https://app.formhaus.dev/login">Start free</a>
        <a class="lp-link" href="#pricing">See pricing</a>
      </div>
    </header>
    <LandingHeroVideo />
  </section>
</template>

<style scoped>
.cloud-hero { padding-top: 48px; }
h1 { margin: 0; font-size: 36px; line-height: 1.1; letter-spacing: -0.03em; font-weight: 700; text-wrap: balance; }
@media (min-width: 960px) {
  .cloud-hero { padding-top: 80px; }
  h1 { font-size: 56px; }
  .lp-head { margin-bottom: 48px; }
}
</style>
