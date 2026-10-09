<script setup lang="ts">
import CopyLine from './CopyLine.vue';
import LucideIcon from './LucideIcon.vue';

const tools = [
  { name: 'validate_definition', text: 'finds errors' },
  { name: 'simulate_path', text: 'walks a branch' },
];
</script>

<template>
  <section class="lp-section" aria-labelledby="agents-title">
    <p class="lp-eyebrow">AI agents</p>
    <h2 id="agents-title" class="lp-title">Agents write it, the engine checks it</h2>
    <p class="lp-lead">Generated forms are checked by the MCP tools before you review them.</p>
    <div class="agents">
      <article class="agents__card lp-card">
        <h3 class="agents__title">MCP server</h3>
        <p class="agents__text"><code>@formhaus/mcp</code> for Claude Code, Claude Desktop and Cursor.</p>
        <ul class="agents__tools">
          <li v-for="tool in tools" :key="tool.name"><code>{{ tool.name }}</code> {{ tool.text }}</li>
        </ul>
      </article>
      <article class="agents__card lp-card">
        <h3 class="agents__title">JSON Schema</h3>
        <p class="agents__text">Autocomplete in editors and agents.</p>
        <slot />
      </article>
      <article class="agents__card agents__card--wide lp-card">
        <h3 class="agents__title">Claude Code plugin</h3>
        <p class="agents__text">MCP server plus a skill that drafts forms.</p>
        <CopyLine
          command="claude plugin marketplace add ignsm/formhaus && claude plugin install formhaus@formhaus"
          label="Copy Claude Code plugin install command"
        />
      </article>
    </div>
    <div class="lp-links">
      <a class="lp-more" href="/guide/mcp">MCP setup <LucideIcon name="arrow-right" /></a>
      <a class="lp-more" href="/recipes/ai-agents">AI agents recipe <LucideIcon name="arrow-right" /></a>
    </div>
  </section>
</template>

<style scoped>
.agents {
  display: grid;
  gap: 16px;
  margin-top: 40px;
}

.agents__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 24px;
}

.vp-doc .agents__title {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 18px;
  line-height: 1.4;
}

.vp-doc .agents__text {
  margin: 0;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.vp-doc .agents__tools {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.vp-doc .agents__tools li {
  margin: 0;
}

.agents__card :deep(div[class*='language-']) {
  border-radius: 8px;
}

.agents__card :deep(.lang) {
  display: none;
}

.agents__card :deep(div[class*='language-'] code) {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (min-width: 960px) {
  .agents {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .agents__card--wide {
    grid-column: 1 / -1;
  }
}
</style>
