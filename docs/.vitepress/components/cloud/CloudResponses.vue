<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import SectionCta from '../landing/SectionCta.vue';
const alt = 'Responses dashboard showing names, emails and messages from a contact form';
</script>

<template>
  <LandingSection id="responses" title="Responses in one place">
    <template #lead>Email alerts, CSV export, or send them to <a href="/cloud/zapier-make">Zapier and Make</a>.</template>
    <figure class="cloud-frame responses">
      <img class="cloud-light" src="/media/landing-responses.png" width="2304" height="1250" :alt="alt" loading="lazy" decoding="async" />
      <img class="cloud-dark" src="/media/landing-responses-dark.png" width="2304" height="1250" :alt="alt" loading="lazy" decoding="async" />
    </figure>
    <SectionCta href="/cloud/submissions" label="See how responses work" />
  </LandingSection>
</template>

<style scoped>
.responses { margin: 0; overflow: hidden; }
img { display: block; width: 100%; height: auto; }
@media (max-width: 767px) {
  img { width: 760px; max-width: none; }
}
</style>
