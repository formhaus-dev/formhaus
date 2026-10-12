<script setup lang="ts">
import CopyLine from './CopyLine.vue';
import LandingSection from './LandingSection.vue';

const embed = '<script src="https://f.formhaus.dev/embed.js" data-form="contact-us" async><' + '/script>';
const alt = 'Formhaus Cloud dashboard showing the Responses tab of a Contact us form, with seven submissions listing name, email, message, form version and when each was sent.';
</script>

<template>
  <LandingSection id="responses" title="Publish it, collect responses" lead="Formhaus Cloud gives every form a link, an embed and a dashboard. Free for 3 forms.">
    <div class="responses__lines">
      <CopyLine command="https://f.formhaus.dev/contact-us" label="Copy form link" />
      <CopyLine :command="embed" label="Copy embed code" />
    </div>
    <figure class="responses">
      <img class="responses__shot responses__shot--light" src="/media/landing-responses.png" width="2304" height="1250" :alt="alt" loading="lazy" decoding="async" />
      <img class="responses__shot responses__shot--dark" src="/media/landing-responses-dark.png" width="2304" height="1250" :alt="alt" loading="lazy" decoding="async" />
    </figure>
    <div class="responses__actions">
      <a class="lp-button" href="/cloud">Start free</a>
      <div class="responses__links">
        <a href="/cloud/webhooks">Webhooks</a>
        <span aria-hidden="true">·</span>
        <a href="/cloud/submissions">CSV export</a>
      </div>
    </div>
  </LandingSection>
</template>

<style scoped>
.responses__lines {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 16px;
  margin-bottom: 16px;
}

.responses__lines :deep(.copy-line__code) {
  white-space: nowrap;
}

.responses__lines :deep(.copy-line__button) {
  width: 44px;
  height: 44px;
  cursor: pointer;
}

.responses__actions,
.responses__links {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
}

.responses__actions { margin-top: 24px; }
.responses__actions a { cursor: pointer; }
.responses__links { gap: 8px; color: var(--vp-c-text-2); font-size: 14px; }
.responses__links a { display: inline-flex; align-items: center; min-height: 44px; }
.responses__links a:hover { color: var(--vp-c-brand-1); }

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
  .responses__lines { grid-template-columns: minmax(0, 1fr); }

  .responses__shot {
    width: 922px;
    max-width: none;
    margin-left: -12px;
  }
}
</style>
