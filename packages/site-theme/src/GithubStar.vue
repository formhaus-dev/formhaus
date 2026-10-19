<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';

const { theme } = useData();
const repo = 'https://github.com/formhaus-dev/formhaus';

const minimumCount = 100;
const stars = computed<{ count: number; label: string } | null>(() => {
  const value = theme.value.githubStars;
  return value && value.count >= minimumCount ? value : null;
});
</script>

<template>
  <a class="gh-star" :class="{ 'gh-star--count': stars }" :href="repo" aria-label="Star Formhaus on GitHub" target="_blank" rel="noopener" data-umami-event="outbound_click" data-umami-event-dest="github_star" data-umami-event-location="nav">
    <svg class="gh-star__mark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
    <span class="gh-star__label">Star</span>
    <span v-if="stars" class="gh-star__count" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="12" height="12"><path fill="currentColor" d="M8 .5l2.2 4.9 5.3.5-4 3.6 1.2 5.2L8 11.9 3.3 14.7l1.2-5.2-4-3.6 5.3-.5L8 .5Z" /></svg>
      {{ stars.label }}
    </span>
  </a>
</template>

<style scoped>
.gh-star {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin-left: 12px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  transition: background-color 0.2s;
}

.dark .gh-star {
  border-color: #3f3f46;
}

.gh-star:hover {
  background: var(--vp-c-bg-soft);
}

.gh-star__count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding-left: 6px;
  border-left: 1px solid var(--vp-c-divider);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 639px) {
  .gh-star {
    margin-left: 4px;
    padding: 0 8px;
  }

  .gh-star--count .gh-star__label {
    display: none;
  }

  .gh-star__count {
    padding-left: 0;
    border-left: 0;
  }
}
</style>
