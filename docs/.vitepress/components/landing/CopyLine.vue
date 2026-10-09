<script setup lang="ts">
import { ref } from 'vue';
import LucideIcon from './LucideIcon.vue';

const props = defineProps<{ command: string; label: string }>();
const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard.writeText(props.command);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <div class="copy-line">
    <code class="copy-line__code"><span class="copy-line__prompt" aria-hidden="true">$</span>{{ props.command }}</code>
    <button type="button" class="copy-line__button" :aria-label="props.label" @click="copy">
      <LucideIcon :name="copied ? 'check' : 'copy'" />
    </button>
    <span class="lp-sr-only" role="status">{{ copied ? 'Copied' : '' }}</span>
  </div>
</template>

<style scoped>
.copy-line {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.copy-line__code {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding: 0;
  background: none;
  white-space: nowrap;
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  color: var(--vp-c-text-1);
}

@media (max-width: 479px) {
  .copy-line__code {
    white-space: normal;
    line-height: 1.6;
  }
}

.copy-line__prompt {
  margin-right: 10px;
  color: var(--vp-c-text-2);
  user-select: none;
}

.copy-line__button {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  color: var(--vp-c-text-2);
  transition: background-color 0.2s, color 0.2s;
}

.copy-line__button:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}
</style>
