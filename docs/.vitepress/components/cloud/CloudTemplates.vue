<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import SectionCta from '../landing/SectionCta.vue';
const templates = [
  { slug: 'nps-survey', name: 'NPS survey', category: 'Feedback' },
  { slug: 'catering-inquiry', name: 'Catering inquiry', category: 'Lead generation' },
  { slug: 'talk-proposal', name: 'Talk proposal (CFP)', category: 'Applications' },
  { slug: 'testimonial-request', name: 'Testimonial request', category: 'Feedback' },
];
</script>

<template>
  <LandingSection id="templates" title="Start from a template" lead="Pick a form and change it to fit your plans.">
    <div class="templates">
      <a v-for="item in templates" :key="item.slug" class="cloud-frame template-tile" :href="`/templates/${item.slug}`">
        <div class="template-preview">
          <img class="cloud-light" :src="`/media/tpl-${item.slug}.png`" width="816" height="816" :alt="`${item.name} form preview`" loading="lazy" decoding="async" />
          <img class="cloud-dark" :src="`/media/tpl-${item.slug}-dark.png`" width="816" height="816" :alt="`${item.name} form preview`" loading="lazy" decoding="async" />
        </div>
        <span class="template-name">{{ item.name }}<span class="template-category">{{ item.category }}</span></span>
      </a>
    </div>
    <SectionCta href="/templates/" label="Browse all templates" />
  </LandingSection>
</template>

<style scoped>
.templates { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
.template-tile { display: flex; flex-direction: column; min-width: 0; color: var(--vp-c-text-1); text-decoration: none; }
.template-preview { aspect-ratio: 1 / 1; overflow: hidden; border-bottom: 1px solid var(--vp-c-divider); }
img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; }
.template-name { display: flex; flex-direction: column; justify-content: center; min-height: 72px; padding: 12px 16px; font-weight: 600; line-height: 24px; }
.template-category { font-size: 13px; line-height: 20px; font-weight: 400; color: var(--vp-c-text-2); }
.template-tile:hover { border-color: var(--vp-c-text-3); }
.template-tile:hover .template-name { color: var(--vp-c-brand-1); }
@media (max-width: 767px) {
  .templates { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .template-name { padding: 12px; }
}
</style>
