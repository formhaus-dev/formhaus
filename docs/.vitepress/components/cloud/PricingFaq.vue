<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import SectionCta from '../landing/SectionCta.vue';
</script>

<template>
  <div id="faq">
    <LandingSection id="faq" title="A few billing questions" lead="What to know before choosing a plan.">
      <div class="faq-list">
        <article>
          <h3>Can I cancel any time?</h3>
          <p>Yes. Paid features stay on until the end of the billing period.</p>
        </article>
        <article>
          <h3>How do I upgrade?</h3>
          <p>Pay for Pro at checkout, and it is on within a day. For Team, email hello@formhaus.dev.</p>
        </article>
        <article>
          <h3>What happens at my limit?</h3>
          <p>New responses stop until next month or until you upgrade. Rejected responses are not stored.</p>
        </article>
        <article>
          <h3>How long are responses kept?</h3>
          <p>Free keeps responses for 90 days. Pro and Team keep them until you delete them. If you move to Free, responses older than 90 days are deleted 60 days later.</p>
        </article>
        <article>
          <h3>Can I pay yearly?</h3>
          <p>Pro costs $19 monthly or $190 yearly. Team costs $49 monthly or $490 yearly.</p>
        </article>
      </div>
      <SectionCta href="mailto:hello@formhaus.dev" label="Ask us a question" />
    </LandingSection>
  </div>
</template>

<style scoped>
article { padding: 24px 0; border-bottom: 1px solid var(--vp-c-divider); }
article:first-child { padding-top: 0; }
h3 { margin: 0 0 8px; font-size: 18px; line-height: 28px; font-weight: 600; }
p { margin: 0; color: var(--vp-c-text-2); }
</style>
