<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
</script>

<template>
  <div id="faq">
    <LandingSection id="faq" title="A few common questions">
      <div class="faq-list">
        <article>
          <h3>Where is my data stored?</h3>
          <p>Your forms and responses are stored in Frankfurt, in the EU.</p>
        </article>
        <article>
          <h3>Is it free to start?</h3>
          <p>Yes. Free includes 3 forms and 100 submissions a month.</p>
        </article>
        <article>
          <h3>Can I take my form elsewhere?</h3>
          <p>Yes. Your form uses an open format, and the packages are MIT-licensed.</p>
        </article>
        <article>
          <h3>Do I need to code?</h3>
          <p>No. Ask your AI agent or use the browser builder, then share your form’s link.</p>
        </article>
        <article>
          <h3>How do I cancel?</h3>
          <p>Cancel any time from your account. Paid features stay on until the end of the billing period.</p>
        </article>
      </div>
    </LandingSection>
  </div>
</template>

<style scoped>
.faq-list { max-width: 760px; margin: 0 auto; }
article { padding: 24px 0; border-bottom: 1px solid var(--vp-c-divider); }
article:first-child { padding-top: 0; }
h3 { margin: 0 0 8px; font-size: 18px; line-height: 28px; font-weight: 600; }
p { margin: 0; color: var(--vp-c-text-2); }
</style>
