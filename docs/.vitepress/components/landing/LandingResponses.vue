<script setup lang="ts">
import LandingSection from './LandingSection.vue';

const alt = 'Formhaus Cloud dashboard showing the Responses tab of a Contact us form, with seven submissions listing name, email, message, form version and when each was sent.';
</script>

<template>
  <LandingSection id="responses" title="Keep track of responses">
    <template #lead>Get responses through your dashboard, email notifications, <a href="/cloud/webhooks">webhooks</a> or <a href="/cloud/submissions">CSV downloads</a>.</template>
    <figure class="responses">
      <img class="responses__shot responses__shot--light" src="/media/landing-responses.png" width="2304" height="1250" :alt="alt" loading="lazy" decoding="async" />
      <img class="responses__shot responses__shot--dark" src="/media/landing-responses-dark.png" width="2304" height="1250" :alt="alt" loading="lazy" decoding="async" />
    </figure>
  </LandingSection>
</template>

<style scoped>
.responses {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg);
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
</style>
