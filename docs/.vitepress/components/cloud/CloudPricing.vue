<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
const plans = [
  { name: 'Free', price: '$0', period: '', annual: '', limits: ['3 forms', '100 submissions/month', '90-day retention', '1 editor'], label: 'Start free', href: 'https://app.formhaus.dev/login' },
  { name: 'Pro', price: '$19', period: '/mo', annual: 'or $190/yr', limits: ['Unlimited forms', '25,000 submissions/month', 'Unlimited retention', '3 editors'], label: 'Choose Pro', href: 'https://app.formhaus.dev/login' },
  { name: 'Team', price: '$49', period: '/mo', annual: 'or $490/yr', limits: ['Unlimited forms', '100,000 submissions/month', 'Unlimited retention', '10 editors'], label: 'Contact us', href: 'mailto:hello@formhaus.dev' },
];
</script>

<template>
  <div id="pricing">
    <LandingSection id="pricing" title="Start free, grow from there" lead="Choose a plan for the responses you need.">
      <div class="cloud-columns">
        <article v-for="plan in plans" :key="plan.name" class="cloud-frame plan">
          <h3>{{ plan.name }}</h3>
          <p class="price">{{ plan.price }}<span>{{ plan.period }}</span></p>
          <p class="annual">{{ plan.annual }}</p>
          <ul><li v-for="limit in plan.limits" :key="limit">{{ limit }}</li></ul>
          <a class="lp-button" :class="{ 'plan-contact': plan.name === 'Team' }" :href="plan.href">{{ plan.label }}</a>
        </article>
      </div>
    </LandingSection>
  </div>
</template>

<style scoped>
h3 { margin: 0; font-size: 20px; font-weight: 600; }
.plan { padding: 28px; display: flex; flex-direction: column; align-items: flex-start; }
.price { margin: 24px 0 0; font-size: 40px; line-height: 48px; font-weight: 650; letter-spacing: -0.03em; }
.price span { font-size: 16px; font-weight: 400; color: var(--vp-c-text-2); letter-spacing: 0; }
.annual { min-height: 24px; margin: 0; color: var(--vp-c-text-2); }
ul { list-style: none; padding: 0; margin: 28px 0; }
li + li { margin-top: 10px; }
.lp-button { margin-top: auto; border: 1px solid transparent; }
.lp-button.plan-contact { border-color: var(--vp-c-divider); color: var(--vp-c-text-1); background: transparent; }
.lp-button.plan-contact:hover { background: var(--vp-c-bg-soft); }
</style>
