<script setup lang="ts">
import LandingHeroVideo from '../landing/LandingHeroVideo.vue';
import LucideIcon from '../landing/LucideIcon.vue';

const video = 'formhaus-cloud';
const caption = 'A webinar signup form is built in the editor and previewed. In a chat with an AI agent, the agent adds a question and counts today’s sign-ups. Responses arrive in the dashboard with a new response notice.';
const alt = 'Form builder showing Save your seat: Spring launch webinar, with steps and fields';
</script>

<template>
  <section class="cloud-hero lp-container" aria-labelledby="cloud-title">
    <header class="lp-head">
      <h1 id="cloud-title">The simple way to collect responses</h1>
      <p class="lp-lead hero-lead">Build your form visually or with your AI assistant. Share it anywhere. Send every response to the tools you already use.</p>
      <div class="cloud-actions">
        <a class="lp-button" href="https://app.formhaus.dev/login">Create a free form</a>
        <a class="lp-link" href="/pricing">See pricing <LucideIcon name="arrow-right" /></a>
      </div>
      <p class="hero-trust">Free for 3 forms · No credit card</p>
    </header>
    <LandingHeroVideo v-if="video" :prefix="video" :start="0" :length="30" :mobile-length="30" mobile-ratio="1 / 1" :caption="caption" />
    <figure v-else class="cloud-frame hero-preview">
      <img class="cloud-light" src="/media/cloud-builder.png" width="2336" height="1232" :alt="alt" loading="eager" fetchpriority="high" />
      <img class="cloud-dark" src="/media/cloud-builder-dark.png" width="2336" height="1232" :alt="alt" loading="eager" fetchpriority="high" />
    </figure>
  </section>
</template>

<style scoped>
.cloud-hero { padding-top: 48px; }
.hero-preview { margin: 0; }
.hero-lead { max-width: 60ch; margin-inline: auto; }
.hero-trust { margin: 16px 0 0; font-size: 14px; line-height: 20px; color: var(--vp-c-text-2); }
img { display: block; width: 100%; height: auto; }
@media (max-width: 767px) {
  img { width: 720px; max-width: none; }
}
h1 { margin: 0; font-size: 36px; line-height: 1.1; letter-spacing: -0.03em; font-weight: 700; text-wrap: balance; }
@media (min-width: 960px) {
  .cloud-hero { padding-top: 80px; }
  h1 { font-size: 56px; }
  .lp-head { margin-bottom: 48px; }
}
</style>
