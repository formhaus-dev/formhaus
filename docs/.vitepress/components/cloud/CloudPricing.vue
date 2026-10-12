<script setup lang="ts">
import { ref } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';

withDefaults(defineProps<{ heading?: 'h1' | 'h2' }>(), { heading: 'h2' });
const billing = ref<'monthly' | 'yearly'>('monthly');
const periods = ['monthly', 'yearly'] as const;
function moveBilling(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  billing.value = event.key === 'Home' ? 'monthly' : event.key === 'End' ? 'yearly' : billing.value === 'monthly' ? 'yearly' : 'monthly';
  const group = event.currentTarget as HTMLElement;
  group.querySelector<HTMLButtonElement>(`[data-period="${billing.value}"]`)?.focus();
}
const plans = [
  { name: 'Free', monthly: '$0', yearly: '$0', limits: ['3 forms', '100 submissions/month', '90-day retention', '1 editor'], label: 'Create a free form', href: 'https://app.formhaus.dev/login' },
  { name: 'Pro', monthly: '$19', yearly: '$190', limits: ['Unlimited forms', '25,000 submissions/month', 'Unlimited retention', '3 editors'], label: 'Choose Pro', href: 'https://app.formhaus.dev/login' },
  { name: 'Team', monthly: '$49', yearly: '$490', limits: ['Unlimited forms', '100,000 submissions/month', 'Unlimited retention', '10 editors'], label: 'Contact us', href: 'mailto:hello@formhaus.dev' },
];
</script>

<template>
  <section id="pricing" class="lp-section" :class="{ 'pricing-hero': heading === 'h1' }" aria-labelledby="pricing-title">
    <div class="lp-container">
      <header class="lp-head">
        <component :is="heading" id="pricing-title" :class="{ 'lp-title': heading === 'h2' }">Start free, grow from there</component>
        <p class="lp-lead">Choose a plan for the responses you need.</p>
        <p class="library-note">Only Formhaus Cloud is paid. The open-source library is free under MIT: use it and host it yourself however you like.</p>
        <a class="lp-link library-link" href="/guide/">Get the library <LucideIcon name="arrow-right" /></a>
      </header>
      <div class="billing" role="radiogroup" aria-label="Billing period" @keydown="moveBilling">
        <button v-for="period in periods" :key="period" type="button" role="radio"
          :data-period="period" :aria-checked="billing === period" :tabindex="billing === period ? 0 : -1"
          @click="billing = period">
          {{ period === 'monthly' ? 'Monthly' : 'Yearly' }}<span v-if="period === 'yearly'">2 months free</span>
        </button>
      </div>
      <div class="cloud-columns">
        <article v-for="plan in plans" :key="plan.name" class="cloud-frame plan">
          <component :is="heading === 'h1' ? 'h2' : 'h3'" class="plan-name">{{ plan.name }}</component>
          <p class="price">{{ plan[billing] }}<span>{{ plan.name === 'Free' ? '' : billing === 'monthly' ? '/mo' : '/yr' }}</span></p>
          <ul><li v-for="limit in plan.limits" :key="limit">{{ limit }}</li></ul>
          <a class="lp-button" :class="{ 'plan-contact': plan.name === 'Team' }" :href="plan.href">{{ plan.label }}</a>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pricing-hero { padding-top: 48px; }
h1 { margin: 0; font-size: 36px; line-height: 1.1; letter-spacing: -0.03em; font-weight: 700; text-wrap: balance; }
@media (min-width: 960px) {
  .pricing-hero { padding-top: 80px; }
  h1 { font-size: 56px; }
  .pricing-hero .lp-head { margin-bottom: 48px; }
}
.plan-name { margin: 0; padding: 0; border: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: 0; }
.plan { padding: 28px; display: flex; flex-direction: column; align-items: flex-start; }
.price { margin: 24px 0 0; font-size: 40px; line-height: 48px; font-weight: 650; letter-spacing: -0.03em; }
.price span { font-size: 16px; font-weight: 400; color: var(--vp-c-text-2); letter-spacing: 0; }
.library-note { margin: 24px auto 8px; max-width: 620px; color: var(--vp-c-text-2); }
.library-link { min-height: 44px; cursor: pointer; }
.billing { display: flex; width: fit-content; max-width: 100%; margin: 0 auto 32px; padding: 4px; border: 1px solid var(--vp-c-divider); border-radius: 12px; gap: 4px; }
.billing button { min-height: 44px; padding: 8px 16px; border-radius: 8px; color: var(--vp-c-text-2); cursor: pointer; }
.billing button[aria-checked="true"] { background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); }
.billing button:hover { color: var(--vp-c-brand-1); }
.billing button:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.billing span { display: block; font-size: 12px; line-height: 16px; }
.price { min-height: 48px; white-space: nowrap; }
.lp-button { cursor: pointer; }
ul { list-style: none; padding: 0; margin: 28px 0; }
li + li { margin-top: 10px; }
.lp-button { margin-top: auto; border: 1px solid transparent; }
.lp-button.plan-contact { border-color: var(--vp-c-divider); color: var(--vp-c-text-1); background: transparent; }
.lp-button.plan-contact:hover { background: var(--vp-c-bg-soft); }
</style>
