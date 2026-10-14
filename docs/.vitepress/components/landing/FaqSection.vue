<script setup lang="ts">
import { ref } from 'vue';
import LandingSection from './LandingSection.vue';
import LucideIcon from './LucideIcon.vue';
import SectionCta from './SectionCta.vue';

defineProps<{ items: { question: string; answer: { text: string; href?: string }[] }[] }>();
const open = ref<Set<number>>(new Set());
function toggle(index: number) {
  if (open.value.has(index)) open.value.delete(index);
  else open.value.add(index);
}
</script>

<template>
  <div id="faq">
    <LandingSection id="faq" title="Frequently asked questions">
      <div class="faq-list">
        <article v-for="(item, index) in items" :key="item.question">
          <h3>
            <button :id="`faq-question-${index}`" type="button" :aria-expanded="open.has(index)"
              :aria-controls="`faq-answer-${index}`" @click="toggle(index)">
              <span>{{ item.question }}</span>
              <LucideIcon name="chevron-down" :class="{ rotated: open.has(index) }" />
            </button>
          </h3>
          <div :id="`faq-answer-${index}`" class="faq-answer" :class="{ 'is-open': open.has(index) }"
            role="region" :aria-labelledby="`faq-question-${index}`" :inert="!open.has(index)">
            <div class="faq-answer-inner">
              <p><template v-for="(part, partIndex) in item.answer" :key="partIndex"><a v-if="part.href" class="lp-link" :href="part.href">{{ part.text }}</a><template v-else>{{ part.text }}</template></template></p>
            </div>
          </div>
        </article>
      </div>
      <SectionCta href="mailto:hello@formhaus.dev" label="Ask us a question" />
    </LandingSection>
  </div>
</template>

<style scoped>
.faq-list { max-width: 720px; margin: 0 auto; }
article { border-bottom: 1px solid var(--vp-c-divider); }
h3 { margin: 0; font-size: 18px; line-height: 28px; font-weight: 600; }
button { display: flex; align-items: center; justify-content: space-between; gap: 24px; width: 100%; min-height: 44px; padding: 24px 0; text-align: left; font: inherit; color: var(--vp-c-text-1); cursor: pointer; }
button:hover { color: var(--vp-c-brand-1); }
button:focus-visible, a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.lucide { transition: transform 200ms ease; }
.rotated { transform: rotate(180deg); }
.faq-answer { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows 200ms ease, visibility 200ms; }
.faq-answer.is-open { grid-template-rows: 1fr; visibility: visible; }
.faq-answer-inner { min-height: 0; overflow: hidden; }
p { margin: 0; padding-bottom: 24px; color: var(--vp-c-text-2); }
a { display: inline; min-height: 0; font-weight: 600; color: var(--vp-c-brand-1); text-decoration: none; cursor: pointer; }
a:hover { color: var(--vp-c-brand-2); }
@media (prefers-reduced-motion: reduce) {
  .faq-answer, .lucide { transition: none; }
}
</style>
