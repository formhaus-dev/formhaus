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
  <LandingSection id="agents" eyebrow="Agent tooling" title="Works in Claude Code, Cursor and any MCP client.">
    <template #lead><code>validate_definition</code> finds errors and <code>simulate_path</code> walks every branch before you review.</template>
    <div class="lp-grid lp-grid--2">
      <article class="lp-card">
        <h3>MCP tools</h3>
        <p>The same engine that renders the form checks it.</p>
        <ul class="agents__tools">
          <li v-for="tool in tools" :key="tool.name"><code>{{ tool.name }}</code><span>{{ tool.text }}</span></li>
        </ul>
      </article>
      <article class="lp-card agents__plugin">
        <h3>Claude Code plugin</h3>
        <p>The MCP server plus a skill that drafts forms from a prompt.</p>
        <CopyLine class="agents__copy" :command="plugin" prompt="$" label="Copy Claude Code plugin install commands" />
        <div class="lp-links agents__links">
          <a class="lp-link" href="/guide/mcp">MCP setup <LucideIcon name="arrow-right" /></a>
          <a class="lp-link" href="/recipes/ai-agents">AI agents recipe <LucideIcon name="arrow-right" /></a>
        </div>
      </article>
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

.agents__plugin {
  display: flex;
  flex-direction: column;
}

.agents__copy {
  margin-top: 24px;
  background: var(--vp-c-bg);
}

.agents__links {
  margin-top: auto;
  padding-top: 24px;
}
</style>
