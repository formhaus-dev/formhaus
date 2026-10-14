<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import SectionCta from '../landing/SectionCta.vue';
import AgentChat from './AgentChat.vue';
import type { AgentScript } from './agent-chat';

const props = withDefaults(defineProps<{ variant?: 'make' | 'summary' }>(), { variant: 'make' });
const sections = {
  make: { title: 'Make forms with your AI agent', lead: 'Describe the form you need and get a link back.' },
  summary: { title: 'Ask your AI agent about responses', lead: 'Find common themes and hear what people need.' },
};
const scripts: Record<'make' | 'summary', AgentScript> = {
  make: {
    ask: 'Make a webinar signup form',
    working: 'Creating form…',
    done: 'Form published',
    reply: 'Your webinar signup form is ready.',
    link: 'https://f.formhaus.dev/spring-webinar',
    caption: 'Animation of a chat with an AI agent. Someone types "Make a webinar signup form". The agent creates and publishes the form, then replies that it is ready at f.formhaus.dev/spring-webinar.',
  },
  summary: {
    ask: 'How many people signed up for the webinar today?',
    working: 'Reading responses…',
    done: 'Read 38 responses',
    reply: '38 people signed up today. Most are in marketing (21) and sales (9). 27 will join live, 11 want the replay. Top question: pricing for small teams.',
    caption: 'Animation of a chat with an AI agent. Someone asks how many people signed up for the webinar today. The agent reads the responses and replies with a summary: 38 signups, mostly from marketing and sales, and the top question is pricing for small teams.',
  },
};
const copy = sections[props.variant];
const script = scripts[props.variant];
</script>

<template>
  <LandingSection id="assistant" :title="copy.title" :lead="copy.lead">
    <AgentChat :script="script" />
    <p class="connector-note">Works with Claude and other AI assistants that support connectors.</p>
    <SectionCta href="/cloud/connect-claude" label="Connect your AI agent" />
  </LandingSection>
</template>

<style scoped>
.connector-note { max-width: 680px; margin: 24px auto 0; text-align: center; color: var(--vp-c-text-2); }
</style>
