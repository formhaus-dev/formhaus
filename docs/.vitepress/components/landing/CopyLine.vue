<script setup lang="ts">
import { computed } from 'vue';
import LucideIcon from './LucideIcon.vue';
import { useCopy } from './copy';

const props = defineProps<{ command: string | string[]; label: string; prompt?: string }>();
const lines = computed(() => [props.command].flat());
const { copied, copy } = useCopy();
</script>

<template>
  <div class="copy-line">
    <code class="copy-line__code"><span v-for="line in lines" :key="line" class="copy-line__row"><span v-if="props.prompt" class="copy-line__prompt" aria-hidden="true">{{ props.prompt }}</span>{{ line }}</span></code>
    <button type="button" class="copy-line__button" :aria-label="props.label" @click="copy(lines.join('\n'))">
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
  min-width: 0;
  padding: 4px 4px 4px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.copy-line__code {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding: 8px 0;
  background: none;
  white-space: nowrap;
  color: var(--vp-c-text-1);
}

.copy-line__row {
  display: block;
}

.copy-line__prompt {
  margin-right: 8px;
  color: var(--vp-c-text-3);
  user-select: none;
}

.copy-line__button {
  display: grid;
  place-items: center;
  flex: none;
  align-self: flex-start;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--vp-c-text-2);
  transition: background-color 0.2s, color 0.2s;
}

.copy-line__button:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

@media (max-width: 767px) {
  .copy-line__code {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .copy-line__button {
    width: 44px;
    height: 44px;
  }
}
</style>
