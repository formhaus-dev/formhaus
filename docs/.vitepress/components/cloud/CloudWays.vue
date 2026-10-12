<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import LandingFrame from '../landing/LandingFrame.vue';
import LucideIcon from '../landing/LucideIcon.vue';
const templates = [
  { slug: 'contact-form', alt: 'Contact form template' },
  { slug: 'event-feedback', alt: 'Event feedback form with rating, attendance and topic choices' },
];
</script>

<template>
  <LandingSection id="ways" title="Three ways to get a form" lead="Ask your agent, build it yourself, or choose a template.">
    <div class="cloud-columns">
      <article>
        <LandingFrame class="way-visual" label="Agent">
          <div class="chat">
            <p class="chat-user">Make a waitlist form</p>
            <p class="chat-reply">Your waitlist form is ready.<br /><span>https://f.formhaus.dev/waitlist</span></p>
            <div class="chat-input" aria-hidden="true">Message your agent <LucideIcon name="arrow-right" /></div>
          </div>
        </LandingFrame>
        <h3>Ask your AI agent</h3>
        <a class="lp-link" href="/cloud/quickstart">Connect your agent <LucideIcon name="arrow-right" /></a>
      </article>
      <article>
        <figure class="way-visual cloud-frame builder">
          <img class="cloud-light" src="/media/landing-build.png" width="2336" height="1600" alt="Formhaus browser builder with a form preview" loading="lazy" decoding="async" />
          <img class="cloud-dark" src="/media/landing-build-dark.png" width="2336" height="1600" alt="Formhaus browser builder with a form preview" loading="lazy" decoding="async" />
        </figure>
        <h3>Build in the browser</h3>
        <a class="lp-link" href="/build">Open the builder <LucideIcon name="arrow-right" /></a>
      </article>
      <article>
        <div class="way-visual cloud-frame template-previews">
          <div v-for="item in templates" :key="item.slug" class="template-crop">
            <img :src="`/og/templates/${item.slug}.jpg`" width="1200" height="630" :alt="item.alt" loading="lazy" decoding="async" />
          </div>
        </div>
        <h3>Start from a template</h3>
        <a class="lp-link" href="/templates/">Browse templates <LucideIcon name="arrow-right" /></a>
      </article>
    </div>
  </LandingSection>
</template>

<style scoped>
article { min-width: 0; }
h3 { margin: 20px 0 0; font-size: 18px; font-weight: 600; }
.way-visual { height: 280px; margin: 0; }
.chat { display: flex; flex-direction: column; flex: 1; padding: 16px; font-size: 14px; }
.chat-input { display: flex; align-items: center; justify-content: space-between; min-height: 44px; margin-top: auto; padding: 0 12px; border: 1px solid var(--vp-c-divider); border-radius: 12px; color: var(--vp-c-text-2); }
.chat p { margin: 0; }
.chat-user { width: fit-content; margin-left: auto !important; padding: 10px 14px; border-radius: 14px 14px 4px 14px; background: var(--vp-c-text-1); color: var(--vp-c-bg); }
.chat-reply { padding-top: 16px; }
.chat-reply span { display: inline-block; margin-top: 8px; color: var(--vp-c-brand-1); overflow-wrap: anywhere; }
.builder { display: flex; align-items: flex-start; background: var(--vp-c-bg-soft); }
.builder img { flex-shrink: 0; width: 720px; max-width: none; height: auto; object-fit: cover; object-position: left top; }
.template-previews { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: center; justify-items: center; gap: 8px; padding: 16px; background: var(--vp-c-bg-soft); }
.template-crop { width: 100%; max-width: 198px; aspect-ratio: 510 / 630; overflow: hidden; border: 1px solid var(--vp-c-divider); border-radius: 8px; }
.template-crop img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 94% center; }
.way-visual :deep(.frame__bar) { background: var(--vp-c-bg); }
@media (max-width: 767px) {
  .way-visual :deep(.frame__main) { min-height: 226px; }
  .way-visual { grid-template-rows: 52px 1fr; }
}
</style>
