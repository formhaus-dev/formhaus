<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import SectionCta from '../landing/SectionCta.vue';
</script>

<template>
  <LandingSection id="builder" title="Build it like a doc" lead="Add fields, group steps, and show questions only when they matter.">
    <figure class="cloud-frame builder-preview">
      <img class="cloud-light" src="/media/cloud-builder-steps.png" width="1772" height="1080" alt="Your session step, with a question shown only for live attendees" loading="lazy" decoding="async" />
      <img class="cloud-dark" src="/media/cloud-builder-steps-dark.png" width="1772" height="1080" alt="Your session step, with a question shown only for live attendees" loading="lazy" decoding="async" />
    </figure>
    <SectionCta href="/build" label="Open the builder" />
  </LandingSection>
</template>

<style scoped>
.builder-preview { max-width: 880px; margin: 0 auto; }
img { display: block; width: 100%; height: auto; }
@media (max-width: 767px) {
  img { width: 560px; max-width: none; }
}
</style>
