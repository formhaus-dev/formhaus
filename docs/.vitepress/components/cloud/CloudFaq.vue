<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import SectionCta from '../landing/SectionCta.vue';
</script>

<template>
  <div id="faq">
    <LandingSection id="faq" title="A few common questions" lead="What to know before you make your first form.">
      <div class="faq-list">
        <article>
          <h3>Where is my data stored?</h3>
          <p>Forms and responses are stored in Frankfurt, EU, with encrypted backups. IP addresses are not stored with responses.</p>
        </article>
        <article>
          <h3>Can I put my own branding on the form?</h3>
          <p>Hosted pages can show your company name and a link to your privacy policy, and on paid plans your logo. There is a small “Made with Formhaus” mark.</p>
        </article>
        <article>
          <h3>Do I need a developer?</h3>
          <p>No. Build in the browser or ask Claude, then share the link.</p>
        </article>
        <article>
          <h3>How do I connect Claude?</h3>
          <p>Add the Formhaus connector in Claude, then ask for a form. The <a class="lp-link" href="/cloud/quickstart">setup guide</a> has the steps.</p>
        </article>
        <article>
          <h3>How do I cancel?</h3>
          <p>Cancel any time from your account. Paid features stay on until the end of the billing period.</p>
        </article>
      </div>
      <SectionCta href="mailto:hello@formhaus.dev" label="Ask us a question" />
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
