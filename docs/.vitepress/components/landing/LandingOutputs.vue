<script setup lang="ts">
import LandingSection from './LandingSection.vue';
import LucideIcon from './LucideIcon.vue';

const outputs = [
  { icon: 'globe', title: 'Hosted page', text: 'A link to share or send.', sample: 'f.formhaus.dev/Xk3d9QpL2a' },
  { icon: 'code', title: 'Embed', text: 'One script tag on any site.', sample: '<script src=".../embed.js" data-form>' },
  { icon: 'send', title: 'Endpoint', text: 'Validated submissions from your own UI.', sample: 'POST api.formhaus.dev/f/Xk3d9QpL2a' },
  { icon: 'webhook', title: 'Webhook', text: 'A signed POST for every submission.', sample: 'Formhaus-Signature: t=…,v1=…' },
  { icon: 'server', title: 'REST API', text: 'Forms and submissions over HTTP.', sample: 'GET /v1/forms/{id}/submissions' },
  { icon: 'sheet', title: 'CSV', text: 'Every submission in one file.', sample: '?format=csv' },
] as const;
</script>

<template>
  <LandingSection
    id="outputs"
    eyebrow="Formhaus Cloud"
    title="One publish, every output."
  >
    <template #lead>Your agent calls <code>publish_form</code> once. Formhaus Cloud hosts the form, validates every submission and keeps the responses.</template>
    <ul class="outputs lp-grid lp-grid--3">
      <li v-for="item in outputs" :key="item.title" class="lp-card outputs__item">
        <h3><LucideIcon :name="item.icon" /> {{ item.title }}</h3>
        <p>{{ item.text }}</p>
        <code class="outputs__sample">{{ item.sample }}</code>
      </li>
    </ul>
    <p class="outputs__price">
      Free for 3 forms. Pro $19/mo, Team $49/mo.
      <a class="lp-link" href="/cloud">Formhaus Cloud <LucideIcon name="arrow-right" /></a>
    </p>
  </LandingSection>
</template>

<style scoped>
.outputs {
  margin: 0;
  padding: 0;
  list-style: none;
}

.outputs__item h3 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.outputs__item h3 .lucide {
  width: 18px;
  height: 18px;
  color: var(--vp-c-text-2);
}

.outputs__sample {
  display: block;
  margin-top: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--vp-c-text-2);
}

.outputs__price {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 24px;
  margin: 24px 0 0;
  font-weight: 600;
}

@media (max-width: 767px) {
  .outputs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .outputs__item {
    padding: 16px;
  }

  .outputs__item h3 {
    font-size: 16px;
  }

  .outputs__sample {
    display: none;
  }
}
</style>
