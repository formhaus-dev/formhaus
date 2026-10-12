<script setup lang="ts">
import { onMounted, ref, useId } from 'vue';

const props = defineProps<{ draft: string; next: string }>();
const emit = defineEmits<{ keep: []; replace: [] }>();
const heading = ref<HTMLElement>();
const titleId = useId();

onMounted(() => heading.value?.focus());
</script>

<template>
  <section class="replace" :aria-labelledby="titleId">
    <h2 :id="titleId" ref="heading" class="replace__title" tabindex="-1">Replace your current draft?</h2>
    <p class="replace__text">
      Your draft “{{ props.draft }}” is saved in this browser. Opening {{ props.next }} replaces it.
    </p>
    <div class="replace__actions">
      <button type="button" class="replace__button" @click="emit('keep')">Keep my draft</button>
      <button type="button" class="replace__button replace__button--primary" @click="emit('replace')">Replace draft</button>
    </div>
  </section>
</template>

<style scoped>
.replace {
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: 480px;
  margin: 48px auto 0;
  padding: 32px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-align: center;
  background: var(--vp-c-bg);
}

.replace__title {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
  outline: none;
}

.replace__text {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--vp-c-text-2);
}

.replace__actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.replace__button {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.replace__button:hover {
  background: var(--vp-c-bg-soft);
}

.replace__button:focus-visible {
  outline: 2px solid var(--vp-c-brand-3);
  outline-offset: 2px;
}

.replace__button--primary {
  border-color: var(--vp-c-brand-3);
  color: var(--vp-c-white);
  background: var(--vp-c-brand-3);
}

.replace__button--primary:hover {
  border-color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-2);
}

@media (max-width: 640px) {
  .replace {
    margin-top: 24px;
    padding: 24px 20px;
  }

  .replace__actions {
    flex-direction: column-reverse;
    justify-self: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .replace__button {
    transition: none;
  }
}
</style>
