<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import LandingFrame from '../landing/LandingFrame.vue';
import SectionCta from '../landing/SectionCta.vue';

const props = withDefaults(defineProps<{ variant?: 'make' | 'summary' }>(), { variant: 'make' });
const copy = {
  make: { title: 'Make forms with Claude', lead: 'Describe the form you need and get a link back.', ask: 'Make a webinar signup form' },
  summary: { title: 'Ask Claude about your responses', lead: 'Find common themes and hear what people need.', ask: "Make a webinar signup form and send me today's responses" },
}[props.variant];
</script>

<template>
  <LandingSection id="assistant" :title="copy.title" :lead="copy.lead">
    <LandingFrame class="conversation" label="Claude">
      <div class="chat">
        <p class="chat-user">{{ copy.ask }}</p>
        <div class="chat-reply">
          <p>Your webinar signup form is ready.<br /><span class="form-link">https://f.formhaus.dev/spring-webinar</span></p>
          <p v-if="props.variant === 'summary'">38 people signed up today. Most are in marketing (21) and sales (9). 27 will join live, 11 want the replay. Top question: pricing for small teams.</p>
        </div>
        <div class="chat-input" aria-hidden="true">Reply to Claude</div>
      </div>
    </LandingFrame>
    <p class="connector-note">Works through the Formhaus connector (MCP) in Claude and other assistants.</p>
    <SectionCta href="/cloud/quickstart" label="Connect Claude" />
  </LandingSection>
</template>

<style scoped>
.conversation { max-width: 760px; margin: 0 auto; }
.chat { display: flex; flex-direction: column; gap: 28px; padding: 32px; font-size: 16px; line-height: 26px; }
.chat p { margin: 0; }
.chat-user { align-self: flex-end; max-width: 440px; padding: 16px 20px; border-radius: 16px 16px 4px 16px; background: var(--vp-c-bg-soft); }
.chat-reply { max-width: 580px; }
.chat-reply p + p { margin-top: 20px; }
.form-link { color: var(--vp-c-brand-1); overflow-wrap: anywhere; }
.chat-input { min-height: 48px; display: flex; align-items: center; padding: 0 16px; border: 1px solid var(--vp-c-divider); border-radius: 12px; color: var(--vp-c-text-3); background: var(--vp-c-bg-soft); }
.connector-note { max-width: 680px; margin: 24px auto 0; text-align: center; color: var(--vp-c-text-2); }
@media (max-width: 767px) {
  .chat { padding: 20px; gap: 24px; }
}
</style>
