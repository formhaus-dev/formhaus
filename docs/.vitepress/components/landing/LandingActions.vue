<script setup lang="ts">
import LucideIcon from './LucideIcon.vue';
</script>

<template>
  <div class="actions">
    <a class="actions__primary" href="/cloud/quickstart">Publish your first form</a>
    <a class="lp-link" href="/guide/">Install the library <LucideIcon name="arrow-right" /></a>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
}

.actions__primary {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 20px;
  border-radius: 22px;
  font-weight: 600;
  text-decoration: none;
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
  transition: background-color 0.2s;
}

.actions__primary:hover {
  color: var(--vp-button-brand-hover-text);
  background: var(--vp-button-brand-hover-bg);
}

@media (max-width: 479px) {
  .actions__primary {
    justify-content: center;
    width: 100%;
  }
}
</style>
