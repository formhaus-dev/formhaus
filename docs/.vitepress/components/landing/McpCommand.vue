<script setup lang="ts">
import { computed, ref } from 'vue';
import CopyLine from './CopyLine.vue';
import LucideIcon from './LucideIcon.vue';
import { useCopy } from './copy';

const props = defineProps<{ id: string }>();
const url = 'https://api.formhaus.dev/mcp';
const clients = [
  { id: 'claude', label: 'Claude Code', command: `claude mcp add -t http formhaus ${url}` },
  { id: 'cursor', label: 'Cursor', command: `"formhaus": { "url": "${url}" }` },
  { id: 'other', label: 'Other MCP', command: url },
];
const activeId = ref(clients[0].id);
const active = computed(() => clients.find((item) => item.id === activeId.value) ?? clients[0]);
const label = computed(() => `Copy ${active.value.label} MCP setup`);
const { copied, copy } = useCopy();

function onKey(event: KeyboardEvent) {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  const next = clients[(clients.indexOf(active.value) + step + clients.length) % clients.length];
  activeId.value = next.id;
  document.getElementById(`${props.id}-${next.id}`)?.focus();
}
</script>

<template>
  <div class="mcp">
    <div class="mcp__tabs" role="tablist" aria-label="MCP client" @keydown="onKey">
      <button
        v-for="client in clients"
        :id="`${props.id}-${client.id}`"
        :key="client.id"
        type="button"
        role="tab"
        class="mcp__tab"
        :aria-selected="client.id === activeId"
        :tabindex="client.id === activeId ? 0 : -1"
        @click="activeId = client.id"
      >{{ client.label }}</button>
    </div>
    <CopyLine class="mcp__line" :command="active.command" :label="label" role="tabpanel" :aria-labelledby="`${props.id}-${active.id}`" />
    <button type="button" class="mcp__copy" @click="copy(active.command)">
      <LucideIcon :name="copied ? 'check' : 'copy'" />
      {{ copied ? 'Copied' : 'Copy MCP setup' }}
    </button>
    <p class="mcp__note">Connect your AI agent. No account needed for your first form.</p>
  </div>
</template>

<style scoped>
.mcp__tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.mcp__tab {
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: color 0.2s, background-color 0.2s;
}

.mcp__tab:hover {
  color: var(--vp-c-text-1);
}

.mcp__tab[aria-selected='true'] {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.mcp__copy {
  display: none;
}

.mcp__note {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--vp-c-text-2);
}

@media (max-width: 767px) {
  .mcp__line {
    display: none;
  }

  .mcp__copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    font-weight: 600;
    color: var(--vp-c-text-1);
    background: var(--vp-c-bg-soft);
  }

  .mcp__tab {
    min-height: 40px;
  }
}
</style>
