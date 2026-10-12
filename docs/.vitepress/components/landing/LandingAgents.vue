<script setup lang="ts">
import CopyLine from './CopyLine.vue';
import LandingSection from './LandingSection.vue';
import LucideIcon from './LucideIcon.vue';

const tools = [
  { name: 'validate_definition', text: 'Finds schema and logic errors with a fix hint.' },
  { name: 'simulate_path', text: 'Walks every branch with sample answers.' },
  { name: 'publish_form', text: 'Returns the link, embed and endpoint.' },
  { name: 'get_submissions', text: 'Reads the responses back.' },
];
const plugin = ['claude plugin marketplace add ignsm/formhaus', 'claude plugin install formhaus@formhaus'];
</script>

<template>
  <LandingSection id="agents" eyebrow="Agents" title="Works in Claude Code, Cursor and any MCP client.">
    <template #lead>Your agent validates, simulates, publishes and reads responses, all over MCP.</template>
    <div class="lp-grid lp-grid--2">
      <article class="lp-card">
        <h3>MCP tools</h3>
        <p>The engine that renders the form also checks it.</p>
        <ul class="agents__tools">
          <li v-for="tool in tools" :key="tool.name"><code>{{ tool.name }}</code><span>{{ tool.text }}</span></li>
        </ul>
      </article>
      <article class="lp-card">
        <h3>Claude Code plugin</h3>
        <p>The MCP server plus a skill that drafts a form from a prompt, a table or a screenshot.</p>
        <CopyLine class="agents__copy" :command="plugin" prompt="$" label="Copy plugin install commands" />
      </article>
    </div>
    <div class="lp-links">
      <a class="lp-link" href="/cloud/quickstart#agents">MCP setup <LucideIcon name="arrow-right" /></a>
      <a class="lp-link" href="/recipes/ai-agents">AI agents recipe <LucideIcon name="arrow-right" /></a>
    </div>
  </LandingSection>
</template>

<style scoped>
.agents__tools {
  display: grid;
  gap: 12px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.agents__tools li {
  display: grid;
  gap: 2px;
  color: var(--vp-c-text-2);
}

.agents__tools code {
  color: var(--vp-c-text-1);
}

.agents__copy {
  margin-top: 24px;
  background: var(--vp-c-bg);
}
</style>
