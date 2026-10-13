<script setup lang="ts">
import LucideIcon from './LucideIcon.vue';

defineProps<{ href: string; label: string }>();
</script>

<template>
  <div class="section-cta">
    <a class="lp-link section-cta__link" :href="href">{{ label }} <LucideIcon name="arrow-right" /></a>
  </div>
</template>

<style scoped>
.section-cta {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.section-cta__link {
  min-height: 44px;
  cursor: pointer;
}
</style>
