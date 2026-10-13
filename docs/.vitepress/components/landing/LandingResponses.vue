<script setup lang="ts">
import LandingSection from './LandingSection.vue';
import SectionCta from './SectionCta.vue';

const alt = 'Formhaus Cloud dashboard showing the Responses tab of a Contact us form, with seven submissions listing name, email, message, form version and when each was sent.';
</script>

<template>
  <LandingSection id="responses" title="Publish it, collect responses" lead="Formhaus Cloud gives every form a link, an embed and a dashboard. Free for 3 forms.">
    <figure class="responses">
      <img class="responses__shot responses__shot--light" src="/media/landing-responses.png" width="2304" height="1250" :alt="alt" loading="lazy" decoding="async" />
      <img class="responses__shot responses__shot--dark" src="/media/landing-responses-dark.png" width="2304" height="1250" :alt="alt" loading="lazy" decoding="async" />
    </figure>
    <SectionCta href="/cloud" label="Learn about Cloud" />
  </LandingSection>
</template>

<style scoped>
.responses {
  --shot-bg: #fafaf9;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--shot-bg);
}

html.dark .responses {
  --shot-bg: #09090b;
}

.responses__shot {
  display: block;
  width: 100%;
  height: auto;
}

.responses__shot--dark,
html.dark .responses__shot--light {
  display: none;
}

html.dark .responses__shot--dark {
  display: block;
}

@media (max-width: 767px) {
  .responses__shot {
    width: 922px;
    max-width: none;
    margin-left: -12px;
  }
}
</style>
